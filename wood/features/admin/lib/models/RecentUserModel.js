const { Model } = require('#lib/Model');
const { FieldString, FieldDate, FieldCurrency } = require('#lib/Fields');

/**
 * @type {Object} Field configuration.
 */
const RECENT_USER_MODEL_FIELDS = {
  name: new FieldString(),
  email: new FieldString(),
  plan: new FieldString(),
  mrr: new FieldCurrency({ currencyFormat: { spaceSeparated: false } }),
  joined: new FieldDate({ dateFormat: 'MMM D, YYYY' }),
};

class RecentUserModel extends Model {
  /**
   * Constructor.
   *
   * @param {String} name - The user's name.
   * @param {String} email - The user's email address.
   * @param {String} plan - The name of the product/price plan the user is subscribed to.
   * @param {Number} mrr - The MRR they are contributing.
   * @param {Date} joined - The date they joined.
   */
  constructor({ name, email, plan, mrr, joined } = {}) {
    super(RECENT_USER_MODEL_FIELDS);

    this.name = name;
    this.email = email;
    this.plan = plan;
    this.mrr = mrr;
    this.joined = joined;
  }

  /**
   * Convert user to JSON.
   *
   * @return {Object}
   */
  toJSON() {
    return {
      name: this.name,
      email: this.email,
      plan: this.plan,
      mrr: this.mrr,
      joined: this.joined,
    };
  }
}

module.exports = {
  RecentUserModel,
  RECENT_USER_MODEL_FIELDS,
};
