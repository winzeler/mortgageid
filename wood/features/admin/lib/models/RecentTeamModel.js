const { Model } = require('#lib/Model');
const { FieldString, FieldDate, FieldCurrency } = require('#lib/Fields');

/**
 * @type {Object} Field configuration.
 */
const RECENT_TEAM_MODEL_FIELDS = {
  name: new FieldString(),
  plan: new FieldString(),
  mrr: new FieldCurrency({ currencyFormat: { spaceSeparated: false } }),
  joined: new FieldDate({ dateFormat: 'MMM D, YYYY' }),
};

class RecentTeamModel extends Model {
  /**
   * Constructor.
   *
   * @param {String} name - The team's name.
   * @param {String} plan - The name of the product/price plan the team is subscribed to.
   * @param {Number} mrr - The MRR they are contributing.
   * @param {Date} joined - The date they joined.
   */
  constructor({ name, email, plan, mrr, joined } = {}) {
    super(RECENT_TEAM_MODEL_FIELDS);

    this.name = name;
    this.plan = plan;
    this.mrr = mrr;
    this.joined = joined;
  }

  /**
   * Convert model to JSON.
   *
   * @return {Object}
   */
  toJSON() {
    return {
      name: this.name,
      plan: this.plan,
      mrr: this.mrr,
      joined: this.joined,
    };
  }
}

module.exports = {
  RecentTeamModel,
  RECENT_TEAM_MODEL_FIELDS,
};
