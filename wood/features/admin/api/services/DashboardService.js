const moment = require('moment');
const { omit, head } = require('lodash');
const { isFeatureEnabled } = require('#lib/Config');
const { Service } = require('#api/Service');
const { UsersService } = require('#features/users/api/services/UsersService');
const { TeamsService } = require('#features/teams/api/services/TeamsService');
const { SubscriptionsService } = require('#features/subscriptions/api/services/SubscriptionsService');
const { DashboardRollupService } = require('#features/admin/api/services/DashboardRollupService');
const { UserDashboardModel } = require('#features/admin/lib/models/UserDashboardModel');
const { TeamDashboardModel } = require('#features/admin/lib/models/TeamDashboardModel');
const { getConfig } = require('#lib/Config');

const COUNT_RECENT_USERS = 3;
const COUNT_RECENT_TEAMS = 3;

class DashboardService extends Service {
  /**
   * The constructor.
   *
   * @param {MassiveJS} db - The database to use to create the user.
   */
  constructor({ db }) {
    super({ db });

    this.usersService = new UsersService({ db });
    this.subscriptionsService = new SubscriptionsService({ db });
    this.teamsService = new TeamsService({ db });
    this.rollupService = new DashboardRollupService({ db });
  }

  /**
   * Get the rollup from the start of the current month.
   *
   * @param {Moment} today - The current day to get the previous month's rollup data for.
   * @param {Array<RollupDayModel>} rollups - The rollups to search through.
   *
   * @return {RollupDayModel}
   */
  getStartOfMonthRollup(today, rollups) {
    const day = today.clone().startOf('month');

    return head(rollups.filter((rollup) => rollup.day.isSame(day)));
  }

  /**
   * Gets dashboard data for users, for installations not using teams.
   *
   * This function is a wee bit loose just now, as it is just an early version designed to get
   * some data in the dashboard.  In the future, that data will be built from a CLI command that
   * runs nightly and builds up a history of data to poll.
   *
   * @param {Transaction} tx - The transaction to work within.
   *
   * @return {Object}
   */
  async getUserData(tx) {
    if (getConfig('admin', 'displayDashboardDemoData')) {
      return this.getSampleUserDashboardData();
    }

    const recentRollups = await this.rollupService.getRecentRollups(tx);
    const currentRollup = head(recentRollups);
    const startRollup = this.getStartOfMonthRollup(currentRollup.day, recentRollups);

    const dashboardData = {
      day: currentRollup.day,
      users_total: currentRollup.usersCount,
      users_new: currentRollup.usersCount - startRollup.usersCount,
      mrr_total: currentRollup.mrrAmount,
      mrr_new: (currentRollup.mrrAmount - startRollup.mrrAmount).toFixed(2),
      recent_users: await this.getRecentUsers(tx),
      days: recentRollups.slice(0, 30).map((rollup) => rollup.toJSON()),
    };

    return new UserDashboardModel(this.stripEmptyMrr(dashboardData));
  }

  /**
   * Gets the COUNT_RECENT_USERS most-recently created users for the dashboard.
   *
   * @param {Transaction} tx - The transaction to use.
   *
   * @return {Object}
   */
  async getRecentUsers(tx) {
    const users = await this.usersService.findBy(tx, {}, {
      page: 1,
      per: COUNT_RECENT_USERS,
      order: [{ field: 'created_at', direction: 'desc' }],
    });

    return Promise.all(users.map(async (user) => {
      const userData = {
        name: user.name,
        email: user.email,
        joined: user.createdAt.format(),
      };

      if (isFeatureEnabled('subscriptions')) {
        const [{ team }] = await this.teamsService.getTeamInfo(tx, user.id);
        const subscription = head(await this.subscriptionsService.findBy(tx, { team_id: team.id }));
        if (subscription) {
          userData.plan = subscription.price.nickname;
          userData.mrr = subscription.mrr().toFixed(2);
        }
      }

      return userData;
    }));
  }

  /**
   * Gets dashboard data for teams, for installations using them.
   *
   * This function is a wee bit loose just now, as it is just an early version designed to get
   * some data in the dashboard.  In the future, that data will be built from a CLI command that
   * runs nightly and builds up a history of data to poll.
   *
   * @param {Transaction} tx - The transaction to work within.
   *
   * @return {Object}
   */
  async getTeamData(tx) {
    if (getConfig('admin', 'displayDashboardDemoData')) {
      return this.getSampleTeamDashboardData();
    }

    const recentRollups = await this.rollupService.getRecentRollups(tx);
    const currentRollup = head(recentRollups);
    const startRollup = this.getStartOfMonthRollup(currentRollup.day, recentRollups);

    const dashboardData = {
      day: currentRollup.day,
      teams_total: currentRollup.teamsCount,
      teams_new: currentRollup.teamsCount - startRollup.teamsCount,
      mrr_total: currentRollup.mrrAmount,
      mrr_new: (currentRollup.mrrAmount - startRollup.mrrAmount).toFixed(2),
      recent_teams: await this.getRecentTeams(tx),
      days: recentRollups.slice(0, 30).map((rollup) => rollup.toJSON()),
    };

    return new TeamDashboardModel(this.stripEmptyMrr(dashboardData));
  }

  /**
   * Gets the COUNT_RECENT_TEAMS most-recently created teams for the dashboard.
   *
   * @param {Transaction} tx - The transaction to use.
   *
   * @return {Object}
   */
  async getRecentTeams(tx) {
    const teams = await this.teamsService.findBy(tx, {}, {
      page: 1,
      per: COUNT_RECENT_TEAMS,
      order: [{ field: 'created_at', direction: 'desc' }],
    });

    return Promise.all(teams.map(async (team) => {
      const teamData = {
        name: team.name,
        email: team.email,
        joined: team.createdAt.format(),
      };

      if (isFeatureEnabled('subscriptions')) {
        const subscription = head(await this.subscriptionsService.findBy(tx, { team_id: team.id }));
        if (subscription) {
          teamData.plan = subscription.price.nickname;
          teamData.mrr = subscription.mrr().toFixed(2);
        }
      }

      return teamData;
    }));
  }

  /**
   * Gets sample dashboard data for users, instead of live data.
   *
   * @return {Object}
   */
  async getSampleUserDashboardData() {
    return new UserDashboardModel(this.stripEmptyMrr({
      users_total: 25,
      users_new: 12,
      mrr_total: 290,
      mrr_new: 150,
      recent_users: [
        {
          name: 'Barb Henderson',
          email: 'barb.henderson@example.com',
          plan: 'Gold Monthly',
          mrr: 150,
          joined: moment().subtract(3, 'days').format(),
        },
        {
          name: 'Emily Jorgensen',
          email: 'emily.jorgensen@example.com',
          plan: 'Silver Monthly',
          mrr: 75,
          joined: moment().subtract(5, 'days').format(),
        },
        {
          name: 'Aitor Santana',
          email: 'aitor.santana@example.com',
          plan: 'Bronze Yearly',
          mrr: 20.83,
          joined: moment().subtract(6, 'days').format(),
        },
      ],
      days: [
        { day: moment.utc().subtract(1, 'days').format('YYYY-MM-DD'), users_count: 25, mrr_amount: 29000 },
        { day: moment.utc().subtract(2, 'days').format('YYYY-MM-DD'), users_count: 24, mrr_amount: 29000 },
        { day: moment.utc().subtract(3, 'days').format('YYYY-MM-DD'), users_count: 22, mrr_amount: 25000 },
        { day: moment.utc().subtract(4, 'days').format('YYYY-MM-DD'), users_count: 22, mrr_amount: 25000 },
        { day: moment.utc().subtract(5, 'days').format('YYYY-MM-DD'), users_count: 20, mrr_amount: 25000 },
        { day: moment.utc().subtract(6, 'days').format('YYYY-MM-DD'), users_count: 19, mrr_amount: 23000 },
        { day: moment.utc().subtract(7, 'days').format('YYYY-MM-DD'), users_count: 18, mrr_amount: 23000 },
        { day: moment.utc().subtract(8, 'days').format('YYYY-MM-DD'), users_count: 18, mrr_amount: 21000 },
        { day: moment.utc().subtract(9, 'days').format('YYYY-MM-DD'), users_count: 17, mrr_amount: 21000 },
        { day: moment.utc().subtract(10, 'days').format('YYYY-MM-DD'), users_count: 16, mrr_amount: 21000 },
        { day: moment.utc().subtract(11, 'days').format('YYYY-MM-DD'), users_count: 16, mrr_amount: 21000 },
        { day: moment.utc().subtract(12, 'days').format('YYYY-MM-DD'), users_count: 15, mrr_amount: 17000 },
        { day: moment.utc().subtract(13, 'days').format('YYYY-MM-DD'), users_count: 14, mrr_amount: 17000 },
        { day: moment.utc().subtract(14, 'days').format('YYYY-MM-DD'), users_count: 14, mrr_amount: 14000 },
        { day: moment.utc().subtract(15, 'days').format('YYYY-MM-DD'), users_count: 14, mrr_amount: 14000 },
        { day: moment.utc().subtract(16, 'days').format('YYYY-MM-DD'), users_count: 10, rr_amount: 12000 },
        { day: moment.utc().subtract(17, 'days').format('YYYY-MM-DD'), users_count: 9, rr_amount: 12000 },
        { day: moment.utc().subtract(18, 'days').format('YYYY-MM-DD'), users_count: 8, rr_amount: 12000 },
        { day: moment.utc().subtract(19, 'days').format('YYYY-MM-DD'), users_count: 8, rr_amount: 12000 },
        { day: moment.utc().subtract(20, 'days').format('YYYY-MM-DD'), users_count: 7, rr_amount: 10000 },
        { day: moment.utc().subtract(21, 'days').format('YYYY-MM-DD'), users_count: 7, rr_amount: 10000 },
        { day: moment.utc().subtract(22, 'days').format('YYYY-MM-DD'), users_count: 6, rr_amount: 9000 },
        { day: moment.utc().subtract(23, 'days').format('YYYY-MM-DD'), users_count: 6, rr_amount: 7000 },
        { day: moment.utc().subtract(24, 'days').format('YYYY-MM-DD'), users_count: 5, rr_amount: 7000 },
        { day: moment.utc().subtract(25, 'days').format('YYYY-MM-DD'), users_count: 5, rr_amount: 3000 },
        { day: moment.utc().subtract(26, 'days').format('YYYY-MM-DD'), users_count: 5, rr_amount: 3000 },
        { day: moment.utc().subtract(27, 'days').format('YYYY-MM-DD'), users_count: 5, rr_amount: 3000 },
        { day: moment.utc().subtract(28, 'days').format('YYYY-MM-DD'), users_count: 4, rr_amount: 1000 },
        { day: moment.utc().subtract(29, 'days').format('YYYY-MM-DD'), users_count: 4, rr_amount: 1000 },
        { day: moment.utc().subtract(30, 'days').format('YYYY-MM-DD'), users_count: 4, rr_amount: 1000 },
      ],
    }));
  }

  /**
   * Gets sample dashboard data for teams, instead of live data.
   *
   * @return {Object}
   */
  async getSampleTeamDashboardData() {
    return new TeamDashboardModel(this.stripEmptyMrr({
      teams_total: 18,
      teams_new: 12,
      mrr_total: 290,
      mrr_new: 150,
      recent_teams: [
        {
          name: 'Deangelo\'s Team',
          plan: 'Gold Monthly',
          mrr: 150,
          joined: moment().subtract(3, 'days').format(),
        },
        {
          name: 'Pavani\'s Team',
          plan: 'Silver Monthly',
          mrr: 75,
          joined: moment().subtract(5, 'days').format(),
        },
        {
          name: 'Dave\'s Team',
          plan: 'Bronze Yearly',
          mrr: 20.83,
          joined: moment().subtract(6, 'days').format(),
        },
      ],
      days: [
        { day: moment.utc().subtract(1, 'days').format('YYYY-MM-DD'), users_count: 25, teams_count: 18, mrr_amount: 29000 },
        { day: moment.utc().subtract(2, 'days').format('YYYY-MM-DD'), users_count: 24, teams_count: 18, mrr_amount: 29000 },
        { day: moment.utc().subtract(3, 'days').format('YYYY-MM-DD'), users_count: 22, teams_count: 17, mrr_amount: 25000 },
        { day: moment.utc().subtract(4, 'days').format('YYYY-MM-DD'), users_count: 22, teams_count: 17, mrr_amount: 25000 },
        { day: moment.utc().subtract(5, 'days').format('YYYY-MM-DD'), users_count: 20, teams_count: 15, mrr_amount: 25000 },
        { day: moment.utc().subtract(6, 'days').format('YYYY-MM-DD'), users_count: 19, teams_count: 14, mrr_amount: 23000 },
        { day: moment.utc().subtract(7, 'days').format('YYYY-MM-DD'), users_count: 18, teams_count: 14, mrr_amount: 23000 },
        { day: moment.utc().subtract(8, 'days').format('YYYY-MM-DD'), users_count: 18, teams_count: 14, mrr_amount: 21000 },
        { day: moment.utc().subtract(9, 'days').format('YYYY-MM-DD'), users_count: 17, teams_count: 13, mrr_amount: 21000 },
        { day: moment.utc().subtract(10, 'days').format('YYYY-MM-DD'), users_count: 16, teams_count: 12, mrr_amount: 21000 },
        { day: moment.utc().subtract(11, 'days').format('YYYY-MM-DD'), users_count: 16, teams_count: 12, mrr_amount: 21000 },
        { day: moment.utc().subtract(12, 'days').format('YYYY-MM-DD'), users_count: 15, teams_count: 11, mrr_amount: 17000 },
        { day: moment.utc().subtract(13, 'days').format('YYYY-MM-DD'), users_count: 14, teams_count: 11, mrr_amount: 17000 },
        { day: moment.utc().subtract(14, 'days').format('YYYY-MM-DD'), users_count: 14, teams_count: 11, mrr_amount: 14000 },
        { day: moment.utc().subtract(15, 'days').format('YYYY-MM-DD'), users_count: 14, teams_count: 11, mrr_amount: 14000 },
        { day: moment.utc().subtract(16, 'days').format('YYYY-MM-DD'), users_count: 10, teams_count: 8, mrr_amount: 12000 },
        { day: moment.utc().subtract(17, 'days').format('YYYY-MM-DD'), users_count: 9, teams_count: 8, mrr_amount: 12000 },
        { day: moment.utc().subtract(18, 'days').format('YYYY-MM-DD'), users_count: 8, teams_count: 8, mrr_amount: 12000 },
        { day: moment.utc().subtract(19, 'days').format('YYYY-MM-DD'), users_count: 8, teams_count: 8, mrr_amount: 12000 },
        { day: moment.utc().subtract(20, 'days').format('YYYY-MM-DD'), users_count: 7, teams_count: 6, mrr_amount: 10000 },
        { day: moment.utc().subtract(21, 'days').format('YYYY-MM-DD'), users_count: 7, teams_count: 6, mrr_amount: 10000 },
        { day: moment.utc().subtract(22, 'days').format('YYYY-MM-DD'), users_count: 6, teams_count: 5, mrr_amount: 9000 },
        { day: moment.utc().subtract(23, 'days').format('YYYY-MM-DD'), users_count: 6, teams_count: 5, mrr_amount: 7000 },
        { day: moment.utc().subtract(24, 'days').format('YYYY-MM-DD'), users_count: 5, teams_count: 4, mrr_amount: 7000 },
        { day: moment.utc().subtract(25, 'days').format('YYYY-MM-DD'), users_count: 5, teams_count: 4, mrr_amount: 3000 },
        { day: moment.utc().subtract(26, 'days').format('YYYY-MM-DD'), users_count: 5, teams_count: 4, mrr_amount: 3000 },
        { day: moment.utc().subtract(27, 'days').format('YYYY-MM-DD'), users_count: 5, teams_count: 4, mrr_amount: 3000 },
        { day: moment.utc().subtract(28, 'days').format('YYYY-MM-DD'), users_count: 4, teams_count: 3, mrr_amount: 1000 },
        { day: moment.utc().subtract(29, 'days').format('YYYY-MM-DD'), users_count: 4, teams_count: 3, mrr_amount: 1000 },
        { day: moment.utc().subtract(30, 'days').format('YYYY-MM-DD'), users_count: 4, teams_count: 3, mrr_amount: 1000 },
      ],
    }));
  }

  /**
   * If subscriptions are disabled, strip empty MRR fields.
   *
   * @param {Object} dashboardData - The data to strip the MRR fields from.
   *
   * @return {Object}
   */
  stripEmptyMrr(dashboardData) {
    if (! isFeatureEnabled('subscriptions')) {
      const strippedData = omit(dashboardData, ['mrr_total', 'mrr_new']);
      if (strippedData.recent_users) {
        strippedData.recent_users = dashboardData.recent_users.map(
          (user) => omit(user, ['plan', 'mrr']),
        );
      }

      if (strippedData.recent_teams) {
        strippedData.recent_teams = dashboardData.recent_teams.map(
          (user) => omit(user, ['plan', 'mrr']),
        );
      }

      return strippedData;
    }

    return dashboardData;
  }
}

module.exports = {
  DashboardService,
};
