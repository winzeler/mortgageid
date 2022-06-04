const moment = require('moment');
const { Model } = require('#lib/Model');
const { FieldNumber, FieldDate, FieldCurrency } = require('#lib/Fields');

/**
 * @type {Object} Field configuration.
 */
const ROLLUP_DAY_MODEL_FIELDS = {
  day: new FieldDate(),
  usersCount: new FieldNumber(),
  teamsCount: new FieldNumber(),
  mrrAmount: new FieldCurrency(),
};

class RollupDayModel extends Model {
  /**
   * Constructor.
   *
   * @param {Date} day - The day the data was rolled up for.
   * @param {Number} users_count - The total number of users in the system on this day.
   * @param {Number} teams_count - The total number of teams in the system on this day.
   * @param {Number} mrr_amount - The total amount of MRR for all subscriptions in the system on
   *                              this day, in cents.
   */
  constructor({ day, users_count = 0, teams_count = 0, mrr_amount = 0 } = {}) {
    super(ROLLUP_DAY_MODEL_FIELDS);

    this.day = moment.utc(day);
    this.usersCount = users_count;
    this.teamsCount = teams_count;
    this.mrrAmountCents = mrr_amount;
    this.mrrAmount = (mrr_amount / 100).toFixed(2);
  }

  /**
   * Convert model to JSON.
   *
   * @return {Object}
   */
  toJSON() {
    return {
      day: this.day.format('YYYY-MM-DD'),
      users_count: this.usersCount,
      teams_count: this.teamsCount,
      mrr_amount: this.mrrAmountCents,
    };
  }
}

module.exports = {
  RollupDayModel,
  ROLLUP_DAY_MODEL_FIELDS,
};
