const moment = require('moment');
const { find, get } = require('lodash');
const { Model } = require('#lib/Model');
const { intervalPrice } = require('#lib/Text');
const { FieldString, FieldDate, FieldEnum, FieldCustom } = require('#lib/Fields');
const { ProductModel } = require('#features/subscriptions/lib/models/ProductModel');
const { CouponModel } = require('#features/subscriptions/lib/models/CouponModel');
const { StripeConfig } = require('#lib/StripeConfig');

const STATUS_ACTIVE = 'active';
const STATUS_INCOMPLETE = 'incomplete';
const STATUS_INCOMPLETE_EXIPRED = 'incomplete_expired';
const STATUS_TRIALING = 'trialing';
const STATUS_PAST_DUE = 'past_due';
const STATUS_CANCELLED = 'canceled';
const STATUS_UNPAID = 'unpaid';

const DAYS_IN_YEAR = 365;
const WEEKS_IN_YEAR = 52;
const MONTHS_IN_YEAR = 12;

/**
 * @type {Object} Field configuration.
 */
const SUBSCRIPTION_MODEL_FIELDS = {
  name: new FieldString({ label: 'Name' }),
  interval: new FieldString({ label: 'Interval' }),
  fullName: new FieldCustom({ // Name & interval
    label: 'Name',
    desktopValueClasses: ['text-center'],
    valueFn: (s, i) => (i ? `${i.value('name')} (${i.value('interval')})` : 'None'),
  }),
  description: new FieldString({ label: 'Description' }),
  youPay: new FieldString({ label: 'You pay:' }),
  nextBillingDate: new FieldDate({
    label: 'Next billing date:',
    dateFormat: 'MMMM D, YYYY',
  }),
  trialEndsAt: new FieldDate({
    label: 'Trial period ends:',
    dateFormat: 'MMMM D, YYYY',
  }),
  status: new FieldEnum({
    [STATUS_ACTIVE]: 'Active',
    [STATUS_INCOMPLETE]: 'Incomplete',
    [STATUS_INCOMPLETE_EXIPRED]: 'Incomplete Expired',
    [STATUS_TRIALING]: 'Trialing',
    [STATUS_PAST_DUE]: 'Past Due',
    [STATUS_CANCELLED]: 'Cancelled',
    [STATUS_UNPAID]: 'Unpaid',
  }),
};

class SubscriptionModel extends Model {
  /**
   * Constructor.
   *
   * @param {Number} id - The ID of this model.
   * @param {Number} team_id - The ID of the team this subscription is for.
   * @param {String} subscription_id - The Stripe ID of this subscription.
   * @param {String} status - The status of this subscription
   * @param {String} product_id - The Stripe ID of the product this subscription is for.
   * @param {String} price_id - The Stripe ID of the price this subscription is for.
   * @param {Array<String>} tax_ids - The Stripe IDs of the taxes applied to this subscription.
   * @param {String} coupon_id - The Stripe ID of the coupon applied to this subscription.
   * @param {String} trial_ends_at - The date the trial period ends.
   * @param {String} next_billing_date - The date of the next scheduled payment.
   * @param {Number} next_invoice_total - The total to be paid for the next invoice, in cents.
   */
  constructor({
    id, team_id, subscription_id, status,
    product_id, price_id, tax_ids = [], coupon_id,
    trial_ends_at, next_billing_date, next_invoice_total,
  } = {}) {
    super(SUBSCRIPTION_MODEL_FIELDS);

    const config = new StripeConfig();

    this.id = id;
    this.teamId = team_id;
    this.subscriptionId = subscription_id;
    this.status = status;

    this.product = new ProductModel(find(config.products, { id: product_id }));
    this.price = find(this.product.prices, { id: price_id });
    this.taxes = tax_ids.map((taxId) => config.findTax(taxId));

    this.coupon = coupon_id
      ? new CouponModel(find(config.coupons, { id: coupon_id }))
      : null;

    this.trialEndsAt = trial_ends_at ? moment(trial_ends_at) : null;
    this.nextBillingDate = moment(next_billing_date);

    this.name = this.product.name;
    this.description = this.product.description;
    this.interval = this.price.intervalCount > 1
      ? `every ${this.price.intervalCount} ${this.price.interval}s`
      : `${this.price.interval}ly`;

    this.next_invoice_total = next_invoice_total;
    this.youPay = intervalPrice(
      next_invoice_total,
      this.price.currency,
      this.price.interval,
      this.price.intervalCount,
    );
  }

  /**
   * If we should update this subscription to ensure we have the latest data.
   *
   * Active subscriptions that are past the billing date should be updated.
   * Incomplete subscriptions should be update.
   *
   * @return {Boolean}
   */
  shouldUpdate() {
    return (this.status === STATUS_ACTIVE && this.nextBillingDate.isBefore(moment()))
      || this.status === STATUS_INCOMPLETE;
  }

  /**
   * If the product for this subscription has all of the provided capabilities.
   *
   * @param {Array<String>} capabilities - The capabilities to check if the product has.
   *
   * @return {Boolean}
   */
  hasCapabilities(capabilities) {
    return this.product.hasCapabilities(capabilities);
  }

  /**
   * Gets the MRR at this price point, in cents.
   *
   * @return {Number}
   */
  mrrCents() {
    switch (this.price.interval) {
      case 'day': return (this.price.unitAmount * DAYS_IN_YEAR) / MONTHS_IN_YEAR;
      case 'week': return (this.price.unitAmount * WEEKS_IN_YEAR) / MONTHS_IN_YEAR;
      case 'month': return this.price.unitAmount;
      case 'year': return this.price.unitAmount / MONTHS_IN_YEAR;

      default:
        throw new Error(`Unknown interval: '${this.interval}'.`);
    }
  }

  /**
   * Gets the MRR at this price point, in dollars.
   *
   * @return {Number}
   */
  mrr() {
    return this.mrrCents() / 100;
  }

  /**
   * Convert model to JSON.
   *
   * @return {Object}
   */
  toJSON() {
    return {
      id: this.id,
      team_id: this.teamId,
      subscription_id: this.subscriptionId,
      status: this.status,
      product_id: this.product.id,
      price_id: this.price.id,
      tax_ids: this.taxes.map((tax) => tax.id),
      coupon_id: get(this.coupon, 'id'),
      trial_ends_at: this.trialEndsAt ? this.trialEndsAt.format() : null,
      next_billing_date: this.nextBillingDate.format(),
      next_invoice_total: this.next_invoice_total,
    };
  }
}

module.exports = {
  SubscriptionModel,
  SUBSCRIPTION_MODEL_FIELDS,
  STATUS_ACTIVE,
  STATUS_INCOMPLETE,
  STATUS_INCOMPLETE_EXIPRED,
  STATUS_TRIALING,
  STATUS_PAST_DUE,
  STATUS_CANCELLED,
  STATUS_UNPAID,
};
