const { get, sortBy, difference } = require('lodash');
const { Model } = require('#lib/Model');
const { FieldString, FieldBoolean } = require('#lib/Fields');

/**
 * @type {Object} Field configuration.
 */
const PRODUCT_MODEL_FIELDS = {
  id: new FieldString({ label: 'ID' }),
  name: new FieldString({ label: 'Name' }),
  description: new FieldString({ label: 'Description' }),
  active: new FieldBoolean({ label: 'Active' }),
  // metadata
  // prices
};

class ProductModel extends Model {
  /**
   * Constructor.
   *
   * @param {Number} id - The Stripe ID of this product.
   * @param {String} name - The name of this product.
   * @param {String} description - The description of this product.
   * @param {Boolean} active - If this product is active.
   * @param {Object} metadata - A collection of metadata about this product.
   * @param {Array} prices - Prices associated to this product.  Will be converted into PriceModels.
   */
  constructor({ id, name, description, active, metadata, prices = [] } = {}) {
    // If required at top of file, creates a circular dependancy
    const { PriceModel } = require('#features/subscriptions/lib/models/PriceModel'); // eslint-disable-line global-require

    super(PRODUCT_MODEL_FIELDS);

    this.id = id;
    this.name = name;
    this.description = description;
    this.active = active;
    this.metadata = metadata;
    this.bullets = JSON.parse(get(metadata, 'bullets', '[]'));
    this.capabilities = JSON.parse(get(metadata, 'capabilities', '[]'));
    this.prices = sortBy(prices, 'metadata.order')
      .map((price) => (price.constructor.name === 'PriceModel' ? price : new PriceModel(price)));
    this.maxMembers = metadata.max_members;
  }

  /**
   * If this product has all of the provided capabilities.
   *
   * @param {Array<String>} capabilities - The list of capabilities that the product must provide.
   *
   * @return {Boolean}
   */
  hasCapabilities(capabilities) {
    // difference will provide the list of required capabilities not in this product's capabilities
    return difference(capabilities, this.capabilities).length === 0;
  }

  /**
   * Convert model to JSON.
   *
   * @return {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      active: this.active,
      metadata: this.metadata,
      prices: this.prices.map(
        (price) => price.toJSON(),
      ),
    };
  }
}

module.exports = {
  ProductModel,
  PRODUCT_MODEL_FIELDS,
};
