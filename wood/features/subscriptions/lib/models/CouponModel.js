const moment = require('moment');
const { Model } = require('#lib/Model');
const { currencyFormat } = require('#lib/Text');
const { FieldString, FieldDate, FieldNumber } = require('#lib/Fields');

/**
 * @type {Object} Field configuration.
 */
const COUPON_MODEL_FIELDS = {
  id: new FieldString({ label: 'ID' }),
  name: new FieldString({ label: 'Name' }),
  discountText: new FieldString({ label: 'Discount' }),
  durationText: new FieldString({ label: 'Duration' }),
  maxRedemptions: new FieldNumber({ label: 'Max. Redemptions' }),
  redeemBy: new FieldDate({ label: 'Redeem By' }),
};

class CouponModel extends Model {
  /**
   * Constructor.
   *
   * @param {Number} id - The Stripe ID of this coupon.
   * @param {String} name - The name of this coupon.
   * @param {Number} amount_off - Amount that will be taken off the subtotal.
   * @param {String} currency - If amount_off is set, the currency of the amount to take off.
   * @param {Number} percent_off - The percent that will be taken off the subtotal.
   * @param {String} duration - 'forver', 'once' or 'repeating'.
   * @param {Number} duration_in_months - If duration is 'repeating', the number of months to
   *                                      repeat.
   * @param {Object} metadata - A collection of metadata about this coupon.
   * @param {Number} max_redemptions - The maximum times this coupon can be redeemed.
   * @param {Number} redeem_by - A timestamp indicating when this coupon must be redeemed by.
   */
  constructor({
    id,
    name,
    amount_off,
    currency,
    percent_off,
    duration,
    duration_in_months,
    metadata,
    max_redemptions,
    redeem_by,
  } = {}) {
    super(COUPON_MODEL_FIELDS);

    this.id = id;
    this.name = name;
    this.amountOff = amount_off;
    this.currency = currency;
    this.percentOff = percent_off;
    this.duration = duration;
    this.durationInMonths = duration_in_months;
    this.metadata = metadata;
    this.maxRedemptions = max_redemptions;
    this.redeemBy = redeem_by ? moment.unix(redeem_by).utc() : null;

    this.discountText = this.amountOff
      ? currencyFormat(this.amountOff, this.currency)
      : `${this.percentOff}%`;
    this.durationText = this.duration === 'repeating'
      ? `for ${this.durationInMonths} months`
      : this.duration;
  }

  /**
   * When displaying the coupon name, use the name if it exists, otherwise the ID.
   *
   * @return {String}
   */
  displayName() {
    return this.name || this.id;
  }

  /**
   * Get the discount this coupon applies to the provided price, in cents.
   *
   * @param {Number} price - The price to apply the discount against.
   *
   * @return {Number}
   */
  getDiscountCents(price) {
    if (this.percentOff) {
      return Math.floor(price * (this.percentOff / 100));
    }

    return this.amountOff;
  }

  /**
   * Get the discount this coupon applies to the provided price, displayed as formatted text.
   *
   * @param {Number} price - The price to apply the discount against.
   * @param {String} currency - The currency to format the price in.
   *
   * @return {Number}
   */
  getDiscountText(price, currency) {
    return currencyFormat(this.getDiscountCents(price), currency);
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
      amount_off: this.amountOff,
      currency: this.currency,
      percent_off: this.percentOff,
      duration: this.duration,
      duration_in_months: this.durationInMonths,
      metadata: this.metadata,
      max_redemptions: this.maxRedemptions,
      redeem_by: this.redeemBy ? this.redeemBy.unix() : null,
    };
  }
}

module.exports = {
  CouponModel,
  COUPON_MODEL_FIELDS,
};
