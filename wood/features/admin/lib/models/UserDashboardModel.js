const moment = require('moment');
const { Model } = require('#lib/Model');
const { FieldNumber, FieldCurrency, FieldDate } = require('#lib/Fields');
const { RecentUserModel } = require('#features/admin/lib/models/RecentUserModel');
const { RollupDayModel } = require('#features/admin/lib/models/RollupDayModel');

/**
 * @type {Object} Field configuration.
 */
const USER_DASHBOARD_MODEL_FIELDS = {
  day: new FieldDate({
    label: 'Rollup date',
    dateFormat: 'MMM D, YYYY',
  }),
  usersTotal: new FieldNumber({ label: 'Total Users' }),
  usersNew: new FieldNumber({ label: 'New Users' }),
  mrrTotal: new FieldCurrency({
    label: 'Total MRR',
    currencyFormat: {
      spaceSeparated: false,
    },
  }),
  mrrNew: new FieldCurrency({
    label: 'New MRR',
    currencyFormat: {
      spaceSeparated: false,
    },
  }),
};

class UserDashboardModel extends Model {
  /**
   * Constructor.
   *
   * @param {Date} day - The day of the most-recent rollup available for these stats.
   * @param {Number} users_total - The total users for this app.
   * @param {Number} users_new - The new users added this calendar month.
   * @param {Number} mrr_total - The total MRR for this app.
   * @param {Number} mrr_new - The new MRR added this calendar month.
   * @param {Array} recent_users - A list of recently-created users.
   * @param {Array} days - The last 30 days of rollup data.
   */
  constructor({ day, users_total, users_new, mrr_total, mrr_new, recent_users, days } = {}) {
    super(USER_DASHBOARD_MODEL_FIELDS);

    this.day = moment.utc(day);
    this.usersTotal = users_total;
    this.usersNew = users_new;
    this.mrrTotal = mrr_total;
    this.mrrNew = mrr_new;
    this.recentUsers = recent_users.map((userData) => new RecentUserModel(userData));
    this.days = days.map((entry) => new RollupDayModel(entry));
  }

  /**
   * Convert model to JSON.
   *
   * @return {Object}
   */
  toJSON() {
    return {
      day: this.day.format(),
      users_total: this.usersTotal,
      users_new: this.usersNew,
      mrr_total: this.mrrTotal,
      mrr_new: this.mrrNew,
      recent_users: this.recentUsers,
      days: this.days.map((entry) => entry.toJSON()),
    };
  }

  /**
   * Indicates if this set of Dashboard data has MRR data included (i.e. if the subscriptions
   * feature is enabled).
   *
   * @return {Boolean}
   */
  hasMrrData() {
    return this.mrrTotal !== undefined;
  }
}

module.exports = {
  UserDashboardModel,
  USER_DASHBOARD_MODEL_FIELDS,
};
