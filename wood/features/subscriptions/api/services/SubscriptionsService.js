const logger = require('pino')({ level: process.env.LOG_LEVEL || 'info' });
const moment = require('moment');
const { head, find, get, compact } = require('lodash');
const { Service } = require('#api/Service');
const { currencyFormat } = require('#lib/Text');
const { SubscriptionModel } = require('#features/subscriptions/lib/models/SubscriptionModel');
const { InvoiceModel } = require('#features/subscriptions/lib/models/InvoiceModel');
const { getConfig, isFeatureEnabled } = require('#lib/Config');
const { StripeConfig } = require('#lib/StripeConfig');
const {
  createStripeCustomer,
  updateStripeCustomer,
  addNewPaymentMethod,
  createSubscription,
  cancelSubscription,
  getSubscription,
  changeSubscriptionPrice,
  getCoupon,
  getNextInvoice,
  getInvoices,
} = require('#lib/Stripe');
const {
  Standard400Error,
  Standard404Error,
  ERROR_NOT_FOUND,
  ERROR_EXPIRED,
  ERROR_STRIPE_ERROR,
} = require('#lib/Errors');

// `this.table(tx)` returns the subscriptions table for use in MassiveJS functions:
// For documentation about Nodewood Services, visit: https://nodewood.com/docs/api/services/
// For documentation about MassiveJS, visit: https://massivejs.org/docs/queries

class SubscriptionsService extends Service {
  /**
   * The constructor.
   *
   * @param {MassiveJS} db - The database to use to create the subscription.
   * @param {Nodemailer} mailer - The mailer to use to send mail.
   */
  constructor({ db, mailer }) {
    super({ db, mailer });
    this.model = SubscriptionModel;
  }

  /**
   * Save the provided payment method with Stripe and set it as default.
   *
   * @param {TeamModel} team - The team to update.
   * @param {UserModel} user - The user making the change.
   * @param {String} payment_method_id - The Stripe ID for the payment method to use.
   * @param {Object} address - The address data for the payment.
   *
   * @return {TeamModel}
   */
  async saveTeamPaymentMethod(team, user, { payment_method_id, ...address }) {
    const name = isFeatureEnabled('teams') ? team.name : user.name;
    const { email } = user;

    const customer = team.stripeCustomerId
      ? await updateStripeCustomer(team.stripeCustomerId, name, email, address)
      : await createStripeCustomer(name, email, address);

    // Update the team OUT OF TRANSACTION with the customer ID (we never want this rolled back)
    await this.db.teams.update(team.id, { stripe_customer_id: customer.id });

    await addNewPaymentMethod(customer.id, payment_method_id);

    team.stripeCustomerId = customer.id;
    return team;
  }

  /**
   * Create a subscription for a customer.
   *
   * Returns both the subscription model and the payment intent (for if the subscription requires
   * further processing to approve).
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {TeamModel} team - The team to update.
   * @param {String} price_id - The Stripe ID for the price to subscribe to.
   * @param {String} product_id - The Stripe ID for the product to subscribe to.
   * @param {String} coupon_id - The Stripe ID for the coupon to apply.
   * @param {String} country - The country to use to calculate taxes for.
   * @param {String} state - The state to use to calculate taxes for.
   *
   * @return {SubscriptionModel, Object}
   */
  async createSubscription(tx, team, { price_id, product_id, coupon_id, country, state }) {
    try {
      const config = new StripeConfig({ currency: team.currency });
      const taxIds = config.getTaxesForAddress(country, state).map((tax) => tax.id);

      const subscriptionResponse = await createSubscription(
        team.stripeCustomerId,
        price_id,
        taxIds,
        coupon_id,
        getConfig('subscriptions', 'trialDays'),
      );
      const invoiceResponse = await getNextInvoice(team.stripeCustomerId);

      const subscription = new this.model(await this.table(tx).insert({
        team_id: team.id,
        subscription_id: subscriptionResponse.id,
        status: subscriptionResponse.status,
        product_id,
        price_id,
        tax_ids: this.toArrayColumn(taxIds),
        coupon_id,
        trial_ends_at: subscriptionResponse.trial_end
          ? moment.unix(subscriptionResponse.trial_end).utc().format()
          : null,
        next_billing_date: moment.unix(subscriptionResponse.current_period_end).utc().format(),
        next_invoice_total: invoiceResponse.total,
      }));

      return {
        subscription,
        payment_intent: subscriptionResponse.latest_invoice.payment_intent,
      };
    }
    catch (error) {
      if (error.constructor.name === 'StripeCardError') {
        logger.error(error);
        throw new Standard400Error([{
          code: ERROR_STRIPE_ERROR,
          title: error.raw.message,
        }]);
      }

      throw error;
    }
  }

  /**
   * Cancel a team's subscription.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {TeamModel} team - The team to cancel the subscription for.
   */
  async cancel(tx, team) {
    const subscription = head(await this.findBy(tx, { team_id: team.id })) || null;

    if (! subscription) {
      throw new Error('No subscription data for team.');
    }

    // Cancel old subscription from Stripe and DB
    await cancelSubscription(
      subscription.subscriptionId,
      getConfig('subscriptions', 'prorateOnCancel'),
    );
    await this.delete(tx, subscription.id);
  }

  /**
   * Returns data required to retry a subscription creation.
   *
   * Returns both the subscription model and the payment intent (for if the subscription requires
   * further processing to approve).
   *
   * If product/price has changed, delete old subscription and create a new one
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {TeamModel} team - The team to update the subscription for.
   * @param {String} price_id - The Stripe ID for the price to subscribe to.
   * @param {String} product_id - The Stripe ID for the product to subscribe to.
   * @param {String} coupon_id - The Stripe ID for the coupon to apply.
   * @param {String} country - The country to use to calculate taxes for.
   * @param {String} state - The state to use to calculate taxes for.
   *
   * @return {SubscriptionModel, Object}
   */
  async retrySubscription(tx, team, { product_id, price_id, coupon_id, country, state }) {
    // Cancel old subscription and create a new one
    await this.cancel(tx, team);
    return this.createSubscription(tx, team, { product_id, price_id, coupon_id, country, state });
  }

  /**
   * Update a subscription with the latest info from Stripe.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {TeamModel} team - The team to update the subscription for.
   * @param {SubscriptionModel} subscription - The Subscription to update.
   *
   * @return {SubscriptionModel}
   */
  async updateSubscription(tx, team, subscription) {
    const subscriptionResponse = await getSubscription(subscription.subscriptionId);
    const invoiceResponse = await getNextInvoice(team.stripeCustomerId);

    return new SubscriptionModel(await this.table(tx).update(subscription.id, {
      next_billing_date: moment.unix(subscriptionResponse.current_period_end).utc(),
      status: subscriptionResponse.status,
      next_invoice_total: invoiceResponse.total,
    }));
  }

  /**
   * Find teams's subscription, and ensure we have the latest nextBillingDate.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {TeamModel} team - The team to get the subscription for.
   *
   * @return {SubscriptionModel}
   */
  async findUpdated(tx, team) {
    let subscription = head(await this.findBy(
      tx,
      { team_id: team.id },
      { order: [{ field: 'created_at', direction: 'desc' }] },
    )) || null;

    if (subscription && subscription.shouldUpdate()) {
      subscription = await this.updateSubscription(tx, team, subscription);
    }

    return subscription;
  }

  /**
   * Gets the requested coupon.
   *
   * @param {TeamModel} team - The ID of the team to get the coupon for.
   * @param {String} id - The Stripe ID of the coupon to get.
   *
   * @return {CouponModel}
   */
  async getCoupon(team, id) {
    const config = new StripeConfig({ currency: team.currency });
    const foundCoupon = find(config.coupons, { id });

    // No coupon by that ID
    if (! foundCoupon) {
      throw new Standard404Error([{
        code: ERROR_NOT_FOUND,
        title: 'The coupon could not be found.',
      }]);
    }

    // Incorrect currency
    if (foundCoupon.currency
      && foundCoupon.currency.toLowerCase() !== team.currency.toLowerCase()) {
      throw new Standard404Error([{
        code: ERROR_NOT_FOUND,
        title: 'The coupon could not be found.',
      }]);
    }

    // Past expiry date
    if (foundCoupon.redeemBy && foundCoupon.redeemBy.isBefore(moment())) {
      throw new Standard400Error([{
        code: ERROR_EXPIRED,
        title: 'The coupon has expired.',
      }]);
    }

    // Too many redemptions
    if (foundCoupon.maxRedemptions) {
      const remoteCoupon = await getCoupon(foundCoupon.id);
      if (remoteCoupon.times_redeemed >= foundCoupon.maxRedemptions) {
        throw new Standard400Error([{
          code: ERROR_EXPIRED,
          title: 'The coupon has expired.',
        }]);
      }
    }

    return foundCoupon;
  }

  /**
   * Gets a list of invoices for a team.
   *
   * @param {TeamModel} team - The team to get the invoices for.
   *
   * @return {Array<InvoiceModel>}
   */
  async getInvoices(team) {
    // If team doesn't even have a customer ID yet, they can't have any invoices
    if (! team.stripeCustomerId) {
      return [];
    }

    return (await getInvoices(team.stripeCustomerId)).map((data) => new InvoiceModel(data));
  }

  /**
   * Preview a change to a team's subscription.
   *
   * @param {TeamModel} team - The team to preview the change for.
   * @param {SubscriptionModel} susbscription - The team's subscription.
   * @param {String} priceId - The ID of the price to preview changing to.
   *
   * @return {Object} The proration lines.
   */
  async previewChange(team, subscription, priceId) {
    const config = new StripeConfig({ currency: team.currency });
    const subscriptionData = await getSubscription(subscription.subscriptionId);

    const items = [{
      id: subscriptionData.items.data[0].id,
      price: priceId,
    }];

    const invoiceData = await getNextInvoice(team.stripeCustomerId, {
      subscription: subscription.subscriptionId,
      subscription_items: items,
      subscription_proration_date: moment().unix(),
    });

    return {
      lines: invoiceData.lines.data.map((lineData) => ({
        description: lineData.description,
        amount: currencyFormat(lineData.amount, invoiceData.currency),
      })),
      discounts: invoiceData.total_discount_amounts.map((discountData) => {
        const coupon = config.findCoupon(invoiceData.discount.coupon.id);

        return {
          description: `${coupon.displayName()} (${coupon.value('discountText')})`,
          amount: currencyFormat(-1 * discountData.amount, invoiceData.currency),
        };
      }),
      taxes: invoiceData.total_tax_amounts.map((taxData) => {
        const tax = config.findTax(taxData.tax_rate);
        return {
          description: tax.fullName(),
          amount: currencyFormat(taxData.amount, invoiceData.currency),
        };
      }),
      total: {
        description: `Total ${invoiceData.total > 0 ? 'charges' : 'credits' } to be applied`,
        amount: currencyFormat(invoiceData.total, invoiceData.currency),
      },
    };
  }

  /**
   * Change a team's subscription.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {TeamModel} team - The team to change the subscription for.
   * @param {SubscriptionModel} susbscription - The team's subscription.
   * @param {String} productId - The ID of the product being changed to.
   * @param {String} priceId - The ID of the price being changed to.
   *
   * @return {Subscription}
   */
  async change(tx, team, subscription, productId, priceId) {
    const subscriptionResponse = await changeSubscriptionPrice(
      subscription.subscriptionId,
      priceId,
    );

    const invoiceResponse = await getNextInvoice(team.stripeCustomerId);

    return new SubscriptionModel(await this.table(tx).update(subscription.id, {
      product_id: productId,
      price_id: priceId,
      next_billing_date: moment.unix(subscriptionResponse.current_period_end).utc(),
      status: subscriptionResponse.status,
      next_invoice_total: invoiceResponse.total,
    }));
  }

  /**
   * Adds subscriptions to teams.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Array<TeamModel>} teams - The teams to add the subscription to.
   *
   * @return {Array<TeamModel>}
   */
  async addSubscriptionToTeams(tx, teams) {
    const subscriptions = await this.table(tx)
      .find({ 'team_id IN ': teams.map((team) => team.id) });

    return teams.map((team) => {
      team.subscription = head(subscriptions.filter((s) => s.team_id === team.id));

      return team;
    });
  }

  /**
   * Adds subscriptions to users.
   *
   * Users being passed into this function will have only one team, and the subscription should be
   * added to that team.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Array<UserModel>} users - The users to add the subscription to.
   *
   * @return {Array<UserModel>}
   */
  async addSubscriptionToUsers(tx, users) {
    const subscriptions = await this.table(tx).find({
      'team_id IN ': compact(users.map((u) => get(head(u.teams), 'team.id'))),
    });

    return users.map((user) => {
      // If user is on team, find subscription
      if (user.teams.length) {
        const data = head(subscriptions.filter((s) => s.team_id === head(user.teams).team.id));

        // If subscription is found, add to user's team
        if (data) {
          user.teams[0].team.subscription = new SubscriptionModel(data);
        }
      }

      return user;
    });
  }
}

module.exports = {
  SubscriptionsService,
};
