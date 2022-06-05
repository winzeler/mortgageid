const { sortBy, get, find } = require('lodash');
const { ProductModel } = require('#features/subscriptions/lib/models/ProductModel');
const { TaxModel } = require('#features/subscriptions/lib/models/TaxModel');
const { CouponModel } = require('#features/subscriptions/lib/models/CouponModel');
const { getConfig } = require('#lib/Config');

class StripeConfig {
  /**
   * Constructor.
   *
   * @param {Boolean} loadProducts - If products should be loaded in this config.
   * @param {Boolean} loadTaxes - If taxes should be loaded in this config.
   * @param {Boolean} loadCoupons - If coupons should be loaded in this config.
   * @param {String} currency - If provided, filter out all prices not for this currency, and all
   *                            products with no remaining prices.
   */
  constructor({
    loadProducts = true,
    loadTaxes = true,
    loadCoupons = true,
    currency,
  } = {}) {
    if (loadProducts) {
      this.loadProducts(currency);
    }

    if (loadTaxes) {
      this.loadTaxes();
    }

    if (loadCoupons) {
      this.loadCoupons();
    }
  }

  /**
   * Load products from Stripe config into models.
   *
   * @param {String} currency - If provided, filter out all prices not for this currency, and all
   *                            products with no remaining prices.
   */
  loadProducts(currency) {
    this.products = sortBy(getConfig('stripe/products'), 'metadata.order')
      .map((config) => new ProductModel(config))
      .map((product) => {
        if (currency) {
          product.prices = product.prices.filter(
            (price) => price.currency.toLowerCase() === currency.toLowerCase(),
          );
        }

        return product;
      })
      .filter((product) => product.prices.length > 0);
  }

  /**
   * Load taxes from Stripe config into models.
   */
  loadTaxes() {
    this.taxes = { countries: {}, states: {} };
    const countryTaxesConfig = get(getConfig('stripe/taxes'), 'countries', {});
    Object.keys(countryTaxesConfig).forEach((countryKey) => {
      this.taxes.countries[countryKey] = countryTaxesConfig[countryKey].map(
        (taxConfig) => new TaxModel({
          jurisdiction: getConfig('geography', 'countries')[countryKey],
          level: 'country',
          ...taxConfig,
        }),
      );
    });

    const stateTaxesConfig = get(getConfig('stripe/taxes'), 'states', {});
    Object.keys(stateTaxesConfig).forEach((countryKey) => {
      this.taxes.states[countryKey] = {};

      Object.keys(stateTaxesConfig[countryKey]).forEach((stateKey) => {
        this.taxes.states[countryKey][stateKey] = stateTaxesConfig[countryKey][stateKey].map(
          (taxConfig) => new TaxModel({
            jurisdiction: `${stateKey}, ${getConfig('geography', 'countries')[countryKey]}`,
            level: 'state',
            ...taxConfig,
          }),
        );
      });
    });
  }

  /**
   * Load coupons from Stripe config into models.
   */
  loadCoupons() {
    this.coupons = getConfig('stripe/coupons').map((config) => new CouponModel(config));
  }

  /**
   * Finds a tax in our list of country/state taxes.
   *
   * @param {String} taxId - The ID of the tax to find.
   *
   * @return {TaxModel}
   */
  findTax(taxId) {
    // Early-return is much more efficient than iterating over the entire tax list
    /* eslint-disable no-restricted-syntax */
    for (const countryKey of Object.keys(this.taxes.countries)) {
      for (const tax of this.taxes.countries[countryKey]) {
        if (tax.id === taxId) {
          return tax;
        }
      }
    }

    for (const countryKey of Object.keys(this.taxes.states)) {
      for (const stateKey of Object.keys(this.taxes.states[countryKey])) {
        for (const tax of (this.taxes.states[countryKey][stateKey])) {
          if (tax.id === taxId) {
            return tax;
          }
        }
      }
    }
    /* eslint-enable */

    return null;
  }

  findCoupon(couponId) {
    return find(this.coupons, { id: couponId });
  }

  /**
   * Find the taxes for the provided country & state.
   *
   * @param {String} country - The country code for the taxes to get.
   * @param {String} state - The state to get the taxes for.
   *
   * @return {Array}
   */
  getTaxesForAddress(country, state) {
    const stateTaxes = get(this.taxes.states, `${country}.${state}`, []);
    const override = stateTaxes.reduce((acc, tax) => acc || tax.override, false);

    return override
      ? stateTaxes
      : get(this.taxes.countries, country, []).concat(stateTaxes);
  }
}

module.exports = {
  StripeConfig,
};
