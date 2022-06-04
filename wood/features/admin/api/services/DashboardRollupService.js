const moment = require('moment');
const { head, last } = require('lodash');
const { Service } = require('#api/Service');
const { UsersService } = require('#features/users/api/services/UsersService');
const { TeamsService } = require('#features/teams/api/services/TeamsService');
const { SubscriptionsService } = require('#features/subscriptions/api/services/SubscriptionsService');
const { RollupDayModel } = require('#features/admin/lib/models/RollupDayModel');
const { NotFoundError, OutOfRangeError } = require('#lib/Errors');

// The number of days of rollups to load from the DB for charts
const DAYS_OF_ROLLUPS = 32;

class DashboardRollupService extends Service {
  /**
   * The constructor.
   *
   * @param {MassiveJS} db - The database to use to create the user.
   */
  constructor({ db }) {
    super({ db, tableName: 'admin_dashboard_rollups' });

    this.usersService = new UsersService({ db });
    this.teamsService = new TeamsService({ db });
    this.subscriptionsService = new SubscriptionsService({ db });

    this.model = RollupDayModel;
  }

  /**
   * Checks if a date is today or later.  Generally used to stop the script.
   *
   * @param {Moment} date - The date to check.
   *
   * @return {Boolean}
   */
  isTodayOrLater(date) {
    return date.isSameOrAfter(moment().startOf('day'));
  }

  /**
   * Gets the day to start rolling up from.
   *
   * @param {Transaction} tx - The transaction to work in.
   *
   * @return {Moment}
   */
  async getStartDate(tx) {
    let startDate;

    const latestRollup = await this.table(tx).findOne({}, {
      order: [{ field: 'day', direction: 'desc' }],
    });

    // No rollups?  Start from first user
    if (latestRollup === null) {
      const firstUser = await (this.db.users.findOne({}, {
        order: [{ field: 'created_at', direction: 'asc' }],
      }));

      if (firstUser === null) {
        throw new NotFoundError('No data to rollup.');
      }

      startDate = moment(firstUser.created_at).startOf('day');
    }
    // Otheriwse, just use next day of most-recent rollup
    else {
      startDate = moment(latestRollup.day).add(1, 'day').startOf('day');
    }

    if (this.isTodayOrLater(startDate)) {
      throw new OutOfRangeError('Cannot perform rollup on current day.');
    }

    return startDate;
  }

  /**
   * Creates the rollup entry for the specified day.
   *
   * @param {Transaction} tx - The transaction to work in.
   * @param {Moment} day - The day to create the rollup for.
   */
  async createRollupForDay(tx, day) {
    await this.table(tx).insert({
      day,
      users_count: await this.getUsersForDay(tx, day),
      teams_count: await this.getTeamsForDay(tx, day),
      mrr_amount: await this.getMrrForDay(tx, day),
    });
  }

  /**
   * Get the count of users created on or before the provided day.
   *
   * @param {Transaction} tx - The transaction to work in.
   * @param {Moment} day - The day to check user count for.
   *
   * @return {Number}
   */
  async getUsersForDay(tx, day) {
    return this.usersService.count(tx, { 'created_at <': day.clone().add(1, 'day').format() });
  }

  /**
   * Get the count of teams created on or before the provided day.
   *
   * @param {Transaction} tx - The transaction to work in.
   * @param {Moment} day - The day to check team count for.
   *
   * @return {Number}
   */
  async getTeamsForDay(tx, day) {
    return this.teamsService.count(tx, { 'created_at <': day.clone().add(1, 'day').format() });
  }

  /**
   * Get sum of MRR for subscriptions created on or before the provided day.
   *
   * @param {Transaction} tx - The transaction to work in.
   * @param {Moment} day - The day to check MRR for.
   *
   * @return {Number}
   */
  async getMrrForDay(tx, day) {
    const subscriptions = await this.subscriptionsService.findBy(tx, {
      'created_at <': day.clone().add(1, 'day').format(),
    });

    return subscriptions.reduce((mrr, subscription) => mrr + subscription.mrrCents(), 0);
  }

  /**
   * Get the last 32 days worth of rollups.
   *
   * @param {Transaction} tx - The transaction to work with.
   *
   * @return {Array<RollupDayModel>}
   */
  async getRecentRollups(tx) {
    // Load a max of 32 days of rollups from the DB
    const rollups = await this.findBy(tx, {}, {
      page: 1,
      per: DAYS_OF_ROLLUPS,
      order: [{ field: 'day', direction: 'desc' }],
    });

    const oldestDay = rollups.length ? last(rollups).day : moment.utc().startOf('day');

    // Fill up to 32 days with empty data
    while (rollups.length < DAYS_OF_ROLLUPS) {
      oldestDay.subtract(1, 'day');
      rollups.push(new RollupDayModel({ day: oldestDay }));
    }

    return rollups;
  }
}

module.exports = {
  DashboardRollupService,
};
