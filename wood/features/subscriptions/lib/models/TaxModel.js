const { get } = require('lodash');
const { Model } = require('#lib/Model');
const { FieldString, FieldBoolean, FieldNumber } = require('#lib/Fields');

/**
 * @type {Object} Field configuration.
 */
const TAX_MODEL_FIELDS = {
  id: new FieldString({ label: 'ID' }),
  displayName: new FieldString({ label: 'Display Name' }),
  description: new FieldString({ label: 'Description' }),
  active: new FieldBoolean({ label: 'Active' }),
  inclusive: new FieldBoolean({ label: 'Inclusive' }),
  override: new FieldBoolean({ label: 'Override' }),
  jurisdiction: new FieldString({ label: 'Jurisdiction' }),
  percentage: new FieldNumber({ label: 'Percentage', numberFormat: { output: 'percent' } }),
  // metadata
};

class TaxModel extends Model {
  /**
   * Constructor.
   *
   * @param {Number} id - The Stripe ID of this tax.
   * @param {String} display_name - The name of this tax.
   * @param {String} description - The description of this tax. Only visible to you.
   * @param {Boolean} active - If this tax is active.
   * @param {Boolean} inclusive - If this tax is inclusive (as opposed to exclusive).
   * @param {Boolean} override - If this tax overrides & replaces higher-level taxes.
   * @param {String} level - The level (country/state) of this tax.
   * @param {Number} percentage - The tax rate out of 100.
   * @param {Object} metadata - A collection of metadata about this tax.
   * @param {String} jurisdiction - The jurisdiction of this tax.
   */
  constructor({
    id,
    display_name,
    description,
    active,
    inclusive,
    override,
    level,
    percentage,
    metadata,
    jurisdiction,
  } = {}) {
    super(TAX_MODEL_FIELDS);

    this.id = id;
    this.displayName = display_name;
    this.description = description;
    this.active = active;
    this.inclusive = inclusive;
    this.level = level;
    this.percentage = percentage / 100;
    this.originalPercentage = percentage;
    this.metadata = metadata;
    this.jurisdiction = jurisdiction;

    this.override = get(this.metadata, 'override', false);
  }

  /**
   * Returns the full descriptive name.
   *
   * @return {String}
   */
  fullName() {
    const inclusive = this.inclusive ? ', Inclusive' : '';

    return `${this.displayName} (${this.originalPercentage}%${inclusive})`;
  }

  /**
   * Calculates the taxes on the provided amount, in cents.
   *
   * @param {Number} amount - The amount to calculate taxes on.
   *
   * @return {Number}
   */
  taxesOn(amount) {
    return this.inclusive
      ? amount * this.percentage / (1 + this.percentage) // eslint-disable-line no-mixed-operators
      : Math.round(amount * this.percentage);
  }

  /**
   * Convert model to JSON.
   *
   * @return {Object}
   */
  toJSON() {
    return {
      id: this.id,
      display_name: this.displayName,
      description: this.description,
      active: this.active,
      inclusive: this.inclusive,
      level: this.level,
      percentage: this.originalPercentage,
      metadata: this.metadata,
      jurisdiction: this.jurisdiction,
    };
  }
}

module.exports = {
  TaxModel,
  TAX_MODEL_FIELDS,
};
