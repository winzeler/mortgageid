const { get, find } = require('lodash');
const { Validator } = require('#lib/Validator');
const { Rule, NotRule } = require('#lib/Rules');
const { ERROR_EMPTY, ERROR_NOT_IN_LIST } = require('#lib/Errors');
const { StripeConfig } = require('#lib/StripeConfig');
const { getConfig } = require('#lib/Config');

class SubscriptionValidator extends Validator {
  /**
   * Constructor.
   *
   * @param {Array<String>} fields - A list of fields to validate for this form.
   * @param {TeamModel} team - The team of the user submitting the form.
   * @param {Object} aliases - A list of aliases, for when field names do not match rule names.
   */
  constructor(fields, team, { aliases = {} } = {}) {
    super(fields, { aliases });

    this.team = team;
    this.rules = {
      line1: [
        new Rule('isEmpty', { code: ERROR_EMPTY, title: 'You must enter an address.' }),
      ],
      country: [
        new Rule('isEmpty', { code: ERROR_EMPTY, title: 'You must enter a country.' }),
        new NotRule(this.countryInList.bind(this), this.countryNotInListError.bind(this)),
      ],
      state: [
        new Rule('isEmpty', { code: ERROR_EMPTY, title: 'You must enter a state/province.' }),
        new NotRule(this.stateInList.bind(this), this.stateNotInListError.bind(this)),
      ],
      city: [
        new Rule('isEmpty', { code: ERROR_EMPTY, title: 'You must enter a city.' }),
      ],
      postal_code: [
        new Rule('isEmpty', { code: ERROR_EMPTY, title: 'You must enter a zip/postal code.' }),
      ],
      payment_method_id: [
        new Rule('isEmpty', { code: ERROR_EMPTY, title: 'You must choose a payment method.' }),
      ],
      product_id: [
        new Rule('isEmpty', { code: ERROR_EMPTY, title: 'You must select a plan.' }),
        new NotRule(this.productInList.bind(this), this.productNotInListError.bind(this)),
      ],
      price_id: [
        new Rule('isEmpty', { code: ERROR_EMPTY, title: 'You must select a price.' }),
        new NotRule(this.priceInList.bind(this), this.priceNotInListError.bind(this)),
      ],
      // Taxes may be empty
      tax_ids: [],
      // Coupons can be any string, or entirely absent
      coupon: [
        new Rule(() => false),
      ],
    };
  }

  /**
   * Validates if provided country is in the list of accepted countries.
   *
   * @param {String} country - The 2-letter country code.
   *
   * @return {Boolean}
   */
  countryInList(country) {
    return Object.keys(getConfig('geography', 'countries')).includes(country);
  }

  /**
   * Returns the error object for when a country is not in the accepted list.
   *
   * @return {Object}
   */
  countryNotInListError() {
    return {
      code: ERROR_NOT_IN_LIST,
      title: 'You must select a valid country.',
      meta: { list: getConfig('geography', 'countries') },
    };
  }

  /**
   * If there is a defined list of states for the form's country, ensure provided state is in that
   * list.  Otherwise, any state is fine.
   *
   * @param {String} state - The state to check.
   *
   * @return {Boolean}
   */
  stateInList(state) {
    return Object.keys(getConfig('geography', 'states')).includes(this.form.country)
      ? getConfig('geography', 'states')[this.form.country].includes(state)
      : true;
  }

  /**
   * Returns the error object for when a state is not in the accepted list.
   *
   * @return {Object}
   */
  stateNotInListError() {
    return {
      code: ERROR_NOT_IN_LIST,
      title: 'You must select a valid state / province.',
      meta: { list: getConfig('geography', 'states')[this.form.country] },
    };
  }

  /**
   * Validates if provided product ID is in the list of configured products.
   *
   * @param {String} productId - The Stripe ID of the product to check.
   *
   * @return {Boolean}
   */
  productInList(productId) {
    const config = new StripeConfig({ currency: this.team.currency });

    return config.products.map((product) => product.id).includes(productId);
  }

  /**
   * Returns the error object for when a product is not in the accepted list.
   *
   * @return {Object}
   */
  productNotInListError() {
    const config = new StripeConfig({ currency: this.team.currency });

    return {
      code: ERROR_NOT_IN_LIST,
      title: 'You must select a valid product.',
      meta: { list: config.products.map((product) => product.name) },
    };
  }

  /**
   * Validates if provided price ID is in the list of configured prices for the select product.
   *
   * @param {String} priceId - The Stripe ID of the price to check.
   *
   * @return {Boolean}
   */
  priceInList(priceId) {
    const config = new StripeConfig({ currency: this.team.currency });

    const foundProduct = find(config.products, { id: this.form.product_id });

    return foundProduct
      ? foundProduct.prices.filter((price) => price.id === priceId).length > 0
      : false;
  }

  /**
   * Returns the error object for when a price is not in the list for the selected product.
   *
   * @return {Object}
   */
  priceNotInListError() {
    const config = new StripeConfig({ currency: this.team.currency });

    const foundProduct = find(config.products, { id: this.form.product_id });

    return {
      code: ERROR_NOT_IN_LIST,
      title: 'You must select a valid price.',
      meta: { list: get(foundProduct, 'prices', []).map((price) => price.nickname) },
    };
  }
}

module.exports = {
  SubscriptionValidator,

  SUBSCRIPTION_CARD_FORM_FIELDS: [
    'line1',
    'country',
    'state',
    'city',
    'postal_code',
  ],

  CREATE_SUBSCRIPTION_FORM_FIELDS: [
    'line1',
    'country',
    'state',
    'city',
    'postal_code',
    'payment_method_id',
    'product_id',
    'price_id',
    'tax_ids',
  ],

  RETRY_SUBSCRIPTION_FORM_FIELDS: [
    'line1',
    'country',
    'state',
    'city',
    'postal_code',
    'payment_method_id',
    'product_id',
    'price_id',
    'tax_ids',
  ],

  CHANGE_SUBSCRIPTION_FORM_FIELDS: [
    'product_id',
    'price_id',
  ],
};
