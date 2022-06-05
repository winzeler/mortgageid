const logger = require('pino')({ level: process.env.LOG_LEVEL || 'info' });
const Stripe = require('stripe');
const { pick, get, last } = require('lodash');

const VALID_ADDRESS_FIELDS = [
  'line1',
  'country',
  'state',
  'city',
  'postal_code',
];

/**
 * NOTE: A new Stripe instance is created in each function so that when Stripe is mocked for
 * tests, that mocked version is what is returned.  If it were created once above all functions,
 * the empty mock from `__mocks__/stripe.js` is what would be returned without the test-specific
 * mocks.
 */

/**
 * Create a customer.
 *
 * @param {String} name - The name of the customer to create.
 * @param {String} email - The email address of the customer to create.
 * @param {Object} address - The address data we're creating with.
 *
 * @return {Object}
 */
async function createStripeCustomer(name, email, address) {
  const stripe = Stripe(process.env.STRIPE_SK); // eslint-disable-line new-cap

  logger.info(`Creating Stripe customer with email '${email}'.`);
  return stripe.customers.create({
    address: pick(address, VALID_ADDRESS_FIELDS),
    name,
    email,
  });
}

/**
 * Update a customer's data.
 *
 * @param {String} stripeCustomerId - The Stripe customer ID.
 * @param {String} name - The name of the customer to update.
 * @param {String} email - The email address of the customer to update.
 * @param {Object} address - The address data we're updating with.
 *
 * @return {Object}
 */
async function updateStripeCustomer(stripeCustomerId, name, email, address) {
  const stripe = Stripe(process.env.STRIPE_SK); // eslint-disable-line new-cap

  logger.info(`Updating Stripe customer with email '${email}'.`);
  return stripe.customers.update(stripeCustomerId, {
    address: pick(address, VALID_ADDRESS_FIELDS),
    name,
    email,
  });
}

/**
 * Add a new payment method to a customer.
 *
 * @param {String} customerId - The ID of the customer to add the payment method to.
 * @param {String} paymentMethodId - The ID of the payment method to add.
 * @param {Boolean} makeDefault - If this payment method should be set as their default.
 */
async function addNewPaymentMethod(customerId, paymentMethodId, { makeDefault = true } = {}) {
  const stripe = Stripe(process.env.STRIPE_SK); // eslint-disable-line new-cap

  logger.info(`Attaching Stripe payment method to customer ID '${customerId}'.`);
  await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });

  if (makeDefault) {
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
  }
}

/**
 * Create a new subscription.
 *
 * The provided Customer ID should be for a Customer with a default payment method set.
 *
 * @param {String} customerId - The ID of the customer to create a subscription for.
 * @param {String} priceId - The ID of the price to subscribe the customer to.
 * @param {String} taxIds - The IDs of the taxes to apply to the subscription.
 * @param {String} couponId - The ID of the coupon to apply.
 * @param {Number} trialDays - The number of trial period days before the customer is charged.
 *
 * @return {Object}
 */
async function createSubscription(customerId, priceId, taxIds, couponId, trialDays) {
  const stripe = Stripe(process.env.STRIPE_SK); // eslint-disable-line new-cap
  const subscriptionData = {
    customer: customerId,
    items: [{ price: priceId }],
    default_tax_rates: taxIds,
    expand: ['latest_invoice.payment_intent'],
  };

  if (couponId) {
    subscriptionData.coupon = couponId;
  }

  if (trialDays) {
    subscriptionData.trial_period_days = trialDays;
  }

  logger.info(`Creating Stripe subscription for customer ID '${customerId}'.`);
  return stripe.subscriptions.create(subscriptionData);
}

/**
 * Updating an existing subscription.
 *
 * The provided Customer ID should be for a Customer with a default payment method set.
 *
 * @param {String} customerId - The ID of the customer to create a subscription for.
 * @param {String} priceId - The ID of the price to subscribe the customer to.
 *
 * @return {Object}
 */
async function updateSubscription(subscriptionId, priceId) {
  const stripe = Stripe(process.env.STRIPE_SK); // eslint-disable-line new-cap

  const subscription = await getSubscription(subscriptionId);

  logger.info(`Updating Stripe subscription with subscription ID '${subscriptionId}'.`);
  return stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: priceId,
    }],
    expand: ['latest_invoice.payment_intent'],
  });
}

/**
 * Cancel a subscription.
 *
 * @param {String} subscriptionId - The ID of the subscription to cancel.
 * @param {Boolean} prorate - If unused time on the final invoice should be prorated.
 *
 * @return {object}
 */
async function cancelSubscription(subscriptionId, prorate) {
  const stripe = Stripe(process.env.STRIPE_SK); // eslint-disable-line new-cap

  return stripe.subscriptions.del(subscriptionId, { prorate });
}

/**
 * Get a subscription from Stripe.
 *
 * @param {String} subscriptionId - The Stripe ID of the subscription.
 * @param {Object} options - Options to modify the retrieved subscription data.
 *
 * @return {Object}
 */
async function getSubscription(subscriptionId, options = {}) {
  const stripe = Stripe(process.env.STRIPE_SK); // eslint-disable-line new-cap

  logger.info(`Getting Stripe subscription for ID '${subscriptionId}'.`);
  return stripe.subscriptions.retrieve(subscriptionId, options);
}

/**
 * Change the price for a subscription .
 *
 * @param {String} subscriptionId - The Stripe ID of the subscription.
 * @param {String} priceId - The ID of the price to change to.
 *
 * @return {Object}
 */
async function changeSubscriptionPrice(subscriptionId, priceId) {
  const stripe = Stripe(process.env.STRIPE_SK); // eslint-disable-line new-cap

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
    proration_behavior: 'create_prorations',
    items: [{
      id: subscription.items.data[0].id,
      price: priceId,
    }],
  });
}

/**
 * Get a coupon from Stripe.
 *
 * @param {String} couponId - The Stripe ID of the coupon.
 *
 * @return {Object}
 */
async function getCoupon(couponId) {
  const stripe = Stripe(process.env.STRIPE_SK); // eslint-disable-line new-cap

  logger.info(`Getting coupon for ID '${couponId}'.`);
  return stripe.coupons.retrieve(couponId);
}

/**
 * Gets the next (upcoming) invoice for a customer.
 *
 * @param {String} customerId - The Stripe ID of the customer to get the next invoice for.
 * @param {Object} options - A list of options to modify the upcoming invoice with.
 *
 * @return {Object}
 */
async function getNextInvoice(customerId, options = {}) {
  const stripe = Stripe(process.env.STRIPE_SK); // eslint-disable-line new-cap

  logger.info(`Getting next invoice for customer '${customerId}'.`);
  return stripe.invoices.retrieveUpcoming({ customer: customerId, ...options });
}

/**
 * Gets the full list of invoices for a customer.
 *
 * @param {String} customerId - The Stripe ID of the customer to get invoices for.
 *
 * @return {Object}
 */
async function getInvoices(customerId) {
  const stripe = Stripe(process.env.STRIPE_SK); // eslint-disable-line new-cap

  logger.info(`Getting invoice list for customer '${customerId}'.`);

  const params = { customer: customerId };
  let response;
  let invoices = [];
  do {
    response = await stripe.invoices.list(params); // eslint-disable-line no-await-in-loop, max-len
    params.starting_after = get(last(response.data), 'id');

    invoices = invoices.concat(response.data);
  } while (response.has_more);

  return invoices;
}

module.exports = {
  createStripeCustomer,
  updateStripeCustomer,
  addNewPaymentMethod,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  getSubscription,
  changeSubscriptionPrice,
  getCoupon,
  getNextInvoice,
  getInvoices,
};
