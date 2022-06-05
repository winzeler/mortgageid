const { get, first, find } = require('lodash');
const { request } = require('#ui/lib/xhr');
const { delayMin } = require('#lib/Time');
const {
  SubscriptionModel,
  STATUS_INCOMPLETE,
} = require('#features/subscriptions/lib/models/SubscriptionModel');
const { CouponModel } = require('#features/subscriptions/lib/models/CouponModel');
const { InvoiceModel } = require('#features/subscriptions/lib/models/InvoiceModel');
const { StripeConfig } = require('#lib/StripeConfig');
const { StripeError } = require('#lib/Errors');
const { getConfig } = require('#lib/Config');

module.exports = {
  namespaced: true,

  state: {
    /**
     * @type {StripeConfig} The Stripe Configuration.
     */
    stripeConfig: null,

    /**
     * @type {ProductModel} The currently-selected product.
     */
    selectedProduct: null,

    /**
     * @type {PriceModel} The currently-selected price.
     */
    selectedPrice: null,

    /**
     * @type {Array<TaxModel>} The taxes for the currently-selected country/state.
     */
    selectedTaxes: [],

    /**
     * @type {CouponModel} The currently-selected coupon.
     */
    selectedCoupon: null,

    /**
     * @type {Boolean} If any of the subscription components have triggered an updating status.
     */
    isSubscriptionUpdating: false,

    /**
     * @type {Array<InvoiceModel>} List of invoices for the user's subscription
     */
    invoices: [],
  },

  mutations: {
    /**
     * Initialize a new StripeConfig object with the provided currency.
     *
     * @param {Object} state - The state to modify.
     * @param {String} currency - The currency to initialzie the StripeConfig with.
     */
    initializeStripeConfig(state, { currency }) {
      state.stripeConfig = new StripeConfig({ currency, loadCoupons: false });

      const signupPlanId = localStorage.getItem('signup-plan-id');
      state.selectedProduct = find(state.stripeConfig.products, (p) => p.id === signupPlanId)
        || first(state.stripeConfig.products);

      state.selectedPrice = first(state.selectedProduct.prices);
    },

    /**
     * Sets whether the subscription is in an updating state.
     *
     * @param {Object} state - The state to modify.
     * @param {Boolean} updating - If the subscription is updating.
     */
    setSubscriptionUpdating(state, { updating }) {
      state.isSubscriptionUpdating = updating;
    },

    /**
     * Sets the currently-selected product.
     *
     * @param {Object} state - The state to modify.
     * @param {ProductModel} product - The product to set.
     */
    setSelectedProduct(state, { product }) {
      state.selectedProduct = product;
    },

    /**
     * Sets the currently-selected price.
     *
     * @param {Object} state - The state to modify.
     * @param {PriceModel} price - The price to set.
     */
    setSelectedPrice(state, { price }) {
      state.selectedPrice = price;
    },

    /**
     * Sets the taxes for the current country/state.
     *
     * If any state taxes are set to "override" country taxes, all country taxes are omitted.
     *
     * @param {Object} state - The state to modify.
     * @param {String} country - The country to get taxes from.
     * @param {String} state - The state to get taxes from.
     */
    setSelectedTaxes(subscriptionState, { country, state }) {
      subscriptionState.selectedTaxes = subscriptionState.stripeConfig.getTaxesForAddress(
        country,
        state,
      );
    },

    /**
     * Sets the currently-selected coupon.
     *
     * @param {Object} state - The state to modify.
     * @param {CouponModel} coupon - The coupon to set.
     */
    setSelectedCoupon(state, { coupon }) {
      state.selectedCoupon = coupon;
    },

    /**
     * Sets the list of invoices for the user's subscription.
     *
     * @param {Object} state - The state to modify.
     * @param {Array<InvoiceModel>} invoices - The invoices to set.
     */
    setInvoices(state, { invoices }) {
      state.invoices = invoices;
    },
  },

  actions: {
    /**
     * Create a subscription.
     *
     * @param {Object} rootState - The root store's state.
     * @param {Object} subscriptionsState - This module's state.
     * @param {Function} commit - Function used to call mutations.
     * @param {Function} dispatch - Function used to dispatch actions.
     * @param {Stripe} stripe - The instance of Stripe to use to create a payment method.
     * @param {Object} card - The Stripe card to charge.
     * @param {String} line1 - The address of the card to charge.
     * @param {String} country - The country of the card to charge.
     * @param {String} state - The state of the card to charge.
     * @param {String} city - The city of the card to charge.
     * @param {String} postal_code - The postal code of the card to charge.
     */
    async createSubscription(
      { rootState, state: subscriptionsState, commit, dispatch },
      { stripe, card, line1, country, state, city, postal_code },
    ) {
      try {
        commit('setSubscriptionUpdating', { updating: true });

        const currentSubscription = rootState.ActiveUser.subscription;
        const productId = subscriptionsState.selectedProduct.id;
        const priceId = subscriptionsState.selectedPrice.id;
        const taxIds = subscriptionsState.selectedTaxes.map((tax) => tax.id);
        const couponId = get(subscriptionsState.selectedCoupon, 'id');
        const address = {
          line1,
          country,
          state,
          city,
          postal_code,
        };
        const paymentMethodId = await createPaymentMethod(
          stripe,
          card,
          rootState.ActiveUser.user,
          address,
        );

        const data = await sendSubscriptionRequest(
          currentSubscription,
          address,
          paymentMethodId,
          productId,
          priceId,
          taxIds,
          couponId,
        );

        let subscription = new SubscriptionModel(data.subscription);
        commit('ActiveUser/saveActive', { subscription }, { root: true });

        subscription = await handlePaymentConfirmation(
          stripe,
          data.payment_intent,
          paymentMethodId,
          dispatch,
          rootState,
        );

        commit('setSubscriptionUpdating', { updating: false });
        return subscription;
      }
      catch (error) {
        commit('setSubscriptionUpdating', { updating: false });
        throw error;
      }
    },

    /**
     * Cancel the user's subscription.
     *
     * @param {Object} rootState - The root store's state.
     * @param {Object} state - This module's state.
     * @param {String} message - The cancellation message left by the user.
     */
    async cancelSubscription({ state, commit }, { message }) {
      await delayMin(
        500,
        request.delete('/api/subscriptions').send({ message }),
      );
      commit('ActiveUser/clearSubscription', {}, { root: true });
    },

    /**
     * Try to get coupon details from its ID.
     *
     * @param {Object} state - The state to modify.
     * @param {Function} commit - Function used to call mutations.
     * @param {String} id - The ID of the coupon to retrieve details for.
     */
    async applyCoupon({ state, commit }, { id }) {
      try {
        commit('setSubscriptionUpdating', { updating: true });

        const { body: { data } } = await delayMin(
          500,
          request.get(`/api/subscriptions/coupons/${id}`),
        );

        commit('setSelectedCoupon', { coupon: new CouponModel(data.coupon) });
        commit('setSubscriptionUpdating', { updating: false });
      }
      catch (error) {
        commit('setSubscriptionUpdating', { updating: false });
        throw error;
      }
    },

    /**
     * Load invoices for the active user.
     *
     * @param {Function} commit - Function used to call mutations.
     */
    async loadInvoices({ commit }) {
      const { body: { data } } = await delayMin(
        500,
        request.get('/api/subscriptions/invoices'),
      );

      commit('setInvoices', {
        invoices: data.invoices.map((invoice) => new InvoiceModel(invoice)),
      });
    },

    /**
     * Preview the change to a user's next invoice if they changed their subscription.
     *
     * @param {Object} context - Unused.
     * @param {ProductModel} product - The product being changed to.
     * @param {PriceModel} price - The price being changed to.
     *
     * @return {Object}
     */
    async previewChange(context, { product, price }) {
      const { body: { data } } = await delayMin(
        500,
        request.post('/api/subscriptions/preview').send({
          product_id: product.id,
          price_id: price.id,
        }),
      );

      return data;
    },

    /**
     * Change the user's subscription to a new product/price.
     *
     * @param {Function} commit - Function used to call mutations.
     * @param {ProductModel} product - The product being changed to.
     * @param {PriceModel} price - The price being changed to.
     */
    async changeSubscription({ commit }, { product, price }) {
      const { body: { data } } = await delayMin(
        500,
        request.put('/api/subscriptions').send({
          product_id: product.id,
          price_id: price.id,
        }),
      );

      const subscription = new SubscriptionModel(data.subscription);

      commit('ActiveUser/saveActive', { subscription }, { root: true });
    },
  },
};

/**
 * Handle confirming payments that require 3D secure or throwing errors for payments that failed.
 *
 * @param {Stripe} stripe - The instance of Stripe to use to create a payment method.
 * @param {Object} paymentIntent - The Stripe PaymentIntent returned from the payment attempt.
 * @param {String} paymentMethodId - The ID of the payment method used for the attempt.
 * @param {Function} dispatch - Function used to dispatch actions.
 * @param {Object} rootState - The root store's state.
 *
 * @return {SubscriptionModel}
 */
async function handlePaymentConfirmation(
  stripe,
  paymentIntent,
  paymentMethodId,
  dispatch,
  rootState,
) {
  if (paymentIntent.status === 'canceled') {
    // Subscription has been cancelled before it could be completed
    throw new StripeError(getConfig('app', 'defaultErrorMessage'));
  }

  if (shouldConfirmPayment(paymentIntent.status)) {
    const confirmResult = await stripe.confirmCardPayment(
      paymentIntent.client_secret,
      { payment_method: paymentMethodId },
    );

    if (confirmResult.error) {
      throw new StripeError(confirmResult.error.message);
    }

    await dispatch('ActiveUser/getActive', { force: true }, { root: true });
  }

  return rootState.ActiveUser.subscription;
}

/**
 * If the PaymentIntent status means we need to confirm the payment.
 *
 * @param {String} status - The status to check.
 *
 * @return {Boolean}
 */
function shouldConfirmPayment(status) {
  return [
    'requires_action',
    'requires_payment_method',
    'requires_confirmation',
    'requires_capture',
  ].includes(status);
}

/**
 * Create a payment method on Stripe and return its ID.
 *
 * @param {Stripe} stripe - Configured Stripe instance.
 * @param {Object} card - The Stripe card data.
 * @param {String} email - The user's email address.
 * @param {String} name - The user's email address.
 * @param {Object} address - The address for the card.
 *
 * @return {Number}
 */
async function createPaymentMethod(stripe, card, user, address) {
  const result = await stripe.createPaymentMethod({
    type: 'card',
    card,
    billing_details: {
      address,
      email: user.email,
      name: user.name,
    },
  });

  if (result.error) {
    throw new StripeError(result.error.message);
  }

  return result.paymentMethod.id;
}

/**
 * Create or retry a subscription.
 *
 * @param {SubscriptionModel} currentSubscription - The active user's subscription, if any.
 * @param {Object} address - The address to use for the subscription.
 * @param {String} paymentMethodId - The Stripe ID of the payment method to use.
 * @param {String} productId - The Stripe ID of the product to subscribe to.
 * @param {String} priceId - The Stripe ID of the price to subscribe to.
 * @param {Array<String>} taxIds - The Stripe IDs of the taxes on the subscription.
 * @param {String} couponId - The Stripe ID of the coupon to apply to the subscription (if any).
 *
 * @return {Object}
 */
async function sendSubscriptionRequest(
  currentSubscription,
  address,
  paymentMethodId,
  productId,
  priceId,
  taxIds,
  couponId,
) {
  if (currentSubscription && currentSubscription.status === STATUS_INCOMPLETE) {
    const { body: { data } } = await delayMin(
      500,
      request.post('/api/subscriptions/retry').send({
        ...address,
        payment_method_id: paymentMethodId,
        product_id: productId,
        price_id: priceId,
        tax_ids: taxIds,
        coupon_id: couponId,
      }),
    );

    return data;
  }

  const { body: { data } } = await delayMin(
    500,
    request.post('/api/subscriptions').send({
      ...address,
      payment_method_id: paymentMethodId,
      product_id: productId,
      price_id: priceId,
      tax_ids: taxIds,
      coupon_id: couponId,
    }),
  );

  return data;
}
