const { head } = require('lodash');
const { Service } = require('#api/Service');
const { TeamModel } = require('#features/teams/lib/models/TeamModel');
const { RoleModel } = require('#features/teams/lib/models/RoleModel');
const { getConfig } = require('#lib/Config');

// `this.table(tx)` returns the teams table for use in MassiveJS functions:
// For documentation about Nodewood Services, visit: https://nodewood.com/docs/api/services/
// For documentation about MassiveJS, visit: https://massivejs.org/docs/queries

class TeamsService extends Service {
  /**
   * The constructor.
   *
   * @param {MassiveJS} db - The database to use to create the team.
   * @param {Nodemailer} mailer - The mailer to use to send mail.
   */
  constructor({ db, mailer }) {
    super({ db, mailer });
    this.model = TeamModel;
  }

  /**
   * Gets a page of teams based on search query.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {String} search - The text to search for, either in name.
   * @param {Object} order - The order to sort the search page.
   * @param {Number} page - The page of teams to get.
   * @param {Number} per - The number of teams to get per page.
   *
   * @return {Array<TeamModel>}
   */
  async getSearchPage(tx, { search, order, page, per } = {}) {
    const query = search
      ? { 'name ilike': `%${search}%` }
      : {};

    return this.findBy(tx, query, { page, per, order });
  }

  /**
   * Get a count of the number of instances would be returned for the specified query.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {String} search - The text to search for, either in name.
   * @param {Object} options - Additional options for the search.
   *
   * @return {Number}
   */
  async count(tx, { search, ...options }) {
    const query = search
      ? { 'name ilike': `%${search}%`, ...options }
      : { ...options };

    return super.count(tx, query);
  }

  /**
   * Find all the teams a user is on and their role on those teams.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Number} userId - The ID of the user to load the team for.
   *
   * @return { TeamModel, RoleModel }
   */
  async getTeamInfo(tx, userId) {
    const teams = await this.table(tx).join({
      users_teams: {
        type: 'INNER',
        on: { team_id: 'id' },
      },
    }).find({ 'users_teams.user_id': userId });

    return teams.map((teamInfo) => ({
      team: new this.model(teamInfo),
      role: new RoleModel({ id: head(teamInfo.users_teams).role }),
    }));
  }

  /**
   * Create a new team and the new owner role.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {UserModel} user - The user to create as the new owner.
   * @param {String} name - The name of the team.
   * @param {String} currency - The currency to use for the team.
   *
   * @return {ModelTeam}
   */
  async create(tx, user, name, currency) {
    const team = new this.model(await this.table(tx).insert({
      name,
      currency: currency || getConfig('subscriptions', 'defaultCurrency'),
    }));
    await tx.users_teams.insert({
      user_id: user.id,
      team_id: team.id,
      role: 'owner',
    });

    return team;
  }
}

module.exports = {
  TeamsService,
};
