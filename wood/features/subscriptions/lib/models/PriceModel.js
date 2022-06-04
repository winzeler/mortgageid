const { isObject } = require('lodash');
const { Model } = require('#lib/Model');
const { FieldString, FieldBoolean } = require('#lib/Fields');
const { intervalPrice } = require('#lib/Text');
const { ProductModel } = require('#features/subscriptions/lib/models/ProductModel');

/**
 * @type {Object} Field configuration.
 */
const PRICE_MODEL_FIELDS = {
  id: new FieldString({ label: 'ID' }),
  nickname: new FieldString({ label: 'Name' }),
  active: new FieldBoolean({ label: 'Active' }),
  intervalPrice: new FieldString({ label: 'Price' }),
};

class PriceModel extends Model {
  /**
   * Constructor.
   *
   * @param {Number} id - The Stripe ID of this price.
   * @param {String} nickname - A nickname for this price.
   * @param {Boolean} active - If this price is active.
   * @param {Number} unit_amount - The amount of the price, in cents.
   * @param {String} currency  - The currency of the price.
   * @param {String} interval - The interval at which the price is charged.
   * @param {Number} interval_count - The number of intervals between billings.
   * @param {Object} metadata - A collection of metadata about this price.
   * @param {ModelProduct} product - The product this price is for.
   */
  constructor({
    id, nickname, active,
    unit_amount, currency, interval, interval_count,
    metadata, product,
  } = {}) {
    super(PRICE_MODEL_FIELDS);

    if (product && (! isObject(product) || product.constructor.name !== 'ModelProduct')) {
      throw new Error('`product` must be a ModelProduct');
    }

    this.id = id;
    this.nickname = nickname;
    this.active = active;
    this.unitAmount = unit_amount;
    this.currency = currency.toUpperCase();
    this.interval = interval;
    this.intervalCount = interval_count;
    this.metadata = metadata;

    this.intervalPrice = intervalPrice(unit_amount, currency, interval, interval_count);

    if (product) {
      this.product = product.constructor.name === 'ProductModel'
        ? product
        : new ProductModel(product);
    }
  }

  /**
   * Convert model to JSON.
   *
   * @return {Object}
   */
  toJSON() {
    return {
      id: this.id,
      nickname: this.nickname,
      active: this.active,
      unit_amount: this.unitAmount,
      currency: this.currency.toLowerCase(),
      interval: this.interval,
      interval_count: this.intervalCount,
      metadata: this.metadata,
      product: this.product ? this.product.toJSON() : null,
    };
  }
}

module.exports = {
  PriceModel,
  PRICE_MODEL_FIELDS,
};
