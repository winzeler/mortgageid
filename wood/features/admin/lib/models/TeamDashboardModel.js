const moment = require('moment');
const { Model } = require('#lib/Model');
const { FieldNumber, FieldCurrency, FieldDate } = require('#lib/Fields');
const { RecentTeamModel } = require('#features/admin/lib/models/RecentTeamModel');
const { RollupDayModel } = require('#features/admin/lib/models/RollupDayModel');

/**
 * @type {Object} Field configuration.
 */
const TEAM_DASHBOARD_MODEL_FIELDS = {
  day: new FieldDate({
    label: 'Rollup date',
    dateFormat: 'MMM D, YYYY',
  }),
  teamsTotal: new FieldNumber({ label: 'Total Teams' }),
  teamsNew: new FieldNumber({ label: 'New Teams' }),
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

class TeamDashboardModel extends Model {
  /**
   * Constructor.
   *
   * @param {Date} day - The day of the most-recent rollup available for these stats.
   * @param {Number} teams_total - The total teams for this app.
   * @param {Number} teams_new - The new teams added this calendar month.
   * @param {Number} mrr_total - The total MRR for this app.
   * @param {Number} mrr_new - The new MRR added this calendar month.
   * @param {Array} recent_teams - A list of recently-created teams.
   * @param {Array} days - The last 30 days of rollup data.
   */
  constructor({ day, teams_total, teams_new, mrr_total, mrr_new, recent_teams, days } = {}) {
    super(TEAM_DASHBOARD_MODEL_FIELDS);

    this.day = moment.utc(day);
    this.teamsTotal = teams_total;
    this.teamsNew = teams_new;
    this.mrrTotal = mrr_total;
    this.mrrNew = mrr_new;
    this.recentTeams = recent_teams.map((teamData) => new RecentTeamModel(teamData));
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
      teams_total: this.teamsTotal,
      teams_new: this.teamsNew,
      mrr_total: this.mrrTotal,
      mrr_new: this.mrrNew,
      recent_teams: this.recentTeams,
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
  TeamDashboardModel,
  TEAM_DASHBOARD_MODEL_FIELDS,
};
