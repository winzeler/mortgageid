const { isUndefined, head } = require('lodash');
const { resolve } = require('path');
const logger = require('pino')({ level: process.env.LOG_LEVEL || 'info' });
const { Service } = require('#api/Service');
const { sendMail } = require('#lib/Email');
const { TeamModel } = require('#features/teams/lib/models/TeamModel');
const { RoleModel } = require('#features/teams/lib/models/RoleModel');
const { TeamMemberModel } = require('#features/teams/lib/models/TeamMemberModel');
const { TeamInviteModel } = require('#features/teams/lib/models/TeamInviteModel');
const { Standard400Error, ERROR_NOT_FOUND } = require('#lib/Errors');
const { getConfig, getLanguageString } = require('#lib/Config');

// TeamMembers is a combination object, made up of data from `users` and `users_teams`.  As such,
// `this.table(tx)` is not available on this service.  Use `this.usersTable(tx)`,
// `this.usersTeamsTable(tx)` and `teamInvitesTable(tx)` instead.
// For documentation about Nodewood Services, visit: https://nodewood.com/docs/api/services/
// For documentation about MassiveJS, visit: https://massivejs.org/docs/queries

class TeamMembersService extends Service {
  /**
   * The constructor.
   *
   * @param {MassiveJS} db - The database to use to create the team.
   * @param {Nodemailer} mailer - The mailer to use to send mail.
   */
  constructor({ db, mailer }) {
    super({ db, mailer, tableName: 'users' });
    this.model = TeamMemberModel;
  }

  /**
   * TeamMembers is a combination object, made up of data from `users` and `users_teams`.  As such,
   * `this.table(tx)` is not available on this service.  Use `this.usersTable(tx)`,
   *
   * @param {Transaction} tx - The transaction to work within.
   *
   * @return {Entity}
   */
  table(tx) {
    throw new Error('`this.table(tx) is disabled on this object.');
  }

  /**
   * Returns a reference to the MassiveJS users table object within the provided transaction.
   *
   * If no transaction provided (null tx), run query through database without a transaction.
   *
   * @param {Transaction} tx - The transaction to work within.
   *
   * @return {Entity}
   */
  usersTable(tx) {
    if (! this.db) {
      throw new Error('DB not configured for this service.');
    }

    const table = tx ? tx.users : this.db.users;

    if (! table) {
      // In development, display error to user in client
      if (process.env.NODE_ENV === 'development') {
        throw new Standard400Error([{
          code: 'MIGRATIONS_MISSING',
          title: 'Table \'users\' does not exist.  Have migrations been run?',
        }]);
      }

      // In production, output error in logs only
      throw new Error('Table \'users\' does not exist.  Have migrations been run?');
    }

    return table;
  }

  /**
   * Returns a reference to the MassiveJS users_teams table object within the provided transaction.
   *
   * If no transaction provided (null tx), run query through database without a transaction.
   *
   * @param {Transaction} tx - The transaction to work within.
   *
   * @return {Entity}
   */
  usersTeamsTable(tx) {
    if (! this.db) {
      throw new Error('DB not configured for this service.');
    }

    const table = tx ? tx.users_teams : this.db.users_teams;

    if (! table) {
      // In development, display error to user in client
      if (process.env.NODE_ENV === 'development') {
        throw new Standard400Error([{
          code: 'MIGRATIONS_MISSING',
          title: 'Table \'users_teams\' does not exist.  Have migrations been run?',
        }]);
      }

      // In production, output error in logs only
      throw new Error('Table \'users_teams\' does not exist.  Have migrations been run?');
    }

    return table;
  }

  /**
   * Returns a reference to the MassiveJS team_invites table object within the provided transaction.
   *
   * If no transaction provided (null tx), run query through database without a transaction.
   *
   * @param {Transaction} tx - The transaction to work within.
   *
   * @return {Entity}
   */
  teamInvitesTable(tx) {
    if (! this.db) {
      throw new Error('DB not configured for this service.');
    }

    const table = tx ? tx.team_invites : this.db.team_invites;

    if (! table) {
      // In development, display error to user in client
      if (process.env.NODE_ENV === 'development') {
        throw new Standard400Error([{
          code: 'MIGRATIONS_MISSING',
          title: 'Table \'team_invites\' does not exist.  Have migrations been run?',
        }]);
      }

      // In production, output error in logs only
      throw new Error('Table \'team_invites\' does not exist.  Have migrations been run?');
    }

    return table;
  }

  /**
   * Gets a page of teams based on search query.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Number} teamId - The ID of the team to get team members for.
   * @param {String} search - The text to search for, either in name or email.
   * @param {Object} order - The order to sort the search page.
   * @param {Number} page - The page of teams to get.
   * @param {Number} per - The number of teams to get per page.
   *
   * @return {Array<TeamMemberModel>}
   */
  async getSearchPage(tx, teamId, { search, page, per, order } = {}) {
    const query = { 'users_teams.team_id': teamId };
    if (search) {
      query.or = [
        { 'name ilike': `%${search}%` },
        { 'email ilike': `%${search}%` },
      ];
    }

    const options = {};
    if (! isUndefined(page) && ! isUndefined(per)) {
      options.offset = (page - 1) * per;
      options.limit = parseInt(per, 10);
      options.order = order;
    }

    const users = await this.usersTable(tx).join({
      users_teams: {
        type: 'INNER',
        on: { user_id: 'id' },
      },
    }).find(query, options);

    return users.map((user) => new TeamMemberModel({
      ...user,
      role: head(user.users_teams).role,
    }));
  }

  /**
   * Get a list of active invites for this team.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Number} teamId - The ID of the team to get team invites for.
   *
   * @return {Array<TeamInviteModel>}
   */
  async getInvites(tx, teamId) {
    return (await this.teamInvitesTable(tx).find({ team_id: teamId }))
      .map((invite) => new TeamInviteModel(invite));
  }

  /**
   * Get a single invite.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {String} token - The token to find the invite for.
   *
   * @return {TeamInviteModel}
   */
  async findInvite(tx, token) {
    let invite = await this.teamInvitesTable(tx).findOne({ token });

    if (invite) {
      invite = new TeamInviteModel(invite);
      if (invite.isExpired) {
        // Make sure this happens outside of transaction or delete will be rolled back by error
        logger.info(`Invite with token ${token} is expired, cancelling...`);
        this.cancelInvite(null, invite.teamId, invite.email);
      }
    }

    if (! invite || invite.isExpired) {
      throw new Standard400Error([{
        code: ERROR_NOT_FOUND,
        title: 'There is no valid invite for that token; it may have expired.',
      }]);
    }

    return invite;
  }

  /**
   * Get a count of the number of instances would be returned for the specified query.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Number} teamId - The ID of the team to get team members for.
   * @param {Object} query - Query for table row to find instances of.
   *
   * @return {Number}
   */
  async count(tx, teamId, query = {}) {
    return Number(await this.usersTeamsTable(tx).count({ team_id: teamId, ...query }));
  }

  /**
   * Get a count of the number of invites for this team.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Number} teamId - The ID of the team to get invites for.
   * @param {Object} query - Query for table row to find instances of.
   *
   * @return {Number}
   */
  async countInvites(tx, teamId, query = {}) {
    return Number(await this.teamInvitesTable(tx).count({ team_id: teamId, ...query }));
  }

  /**
   * Invite a new member to the team.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Number} teamId - The ID of the team to invite the new member to.
   * @param {String} token - The token to use to accept the invite.
   * @param {String} name - The name of the team member.
   * @param {String} email - The team member's email address.
   * @param {String} role - The role to use for the new team member.
   *
   * @return {ModelTeam}
   */
  async createInvite(tx, teamId, token, { name, email, role }) {
    return new TeamInviteModel(await this.teamInvitesTable(tx).insert({
      team_id: teamId,
      name,
      email,
      role,
      token,
    }, {
      onConflict: {
        target: ['team_id', 'email'],
        action: 'update',
        exclude: ['team_id', 'email'],
      },
    }));
  }

  /**
   * Sends an email with password reset link.
   *
   * @param {TeamModel} team - The team the user is being invited to.
   * @param {TeamInviteModel} invite - The team member being invited.
   * @param {String} token - The token the user will use to join the team securely.
   *
   * @return {UserModel}
   */
  async sendInviteMail(team, invite, token) {
    await sendMail(this.mailer, {
      from: `${getConfig('app', 'name')} <${getConfig('email', 'fromEmail')}>`,
      to: invite.email,
      subject: getLanguageString('teams', 'inviteMailSubject', {
        appName: getConfig('app', 'name'),
        teamName: team.name,
      }),
      template: resolve(__dirname, '../emails/Invite.ejs'),
      data: {
        token,
        memberName: invite.name,
        appName: getConfig('app', 'name'),
        appUrl: getConfig('app', 'url'),
        inviteEmailHeader: getLanguageString('teams', 'inviteEmailHeader', {
          appName: getConfig('app', 'name'),
          teamName: team.name,
        }),
        inviteEmailBody1: getLanguageString('teams', 'inviteEmailBody1', {
          appName: getConfig('app', 'name'),
          teamName: team.name,
        }),
        inviteEmailBody2: getLanguageString('teams', 'inviteEmailBody2'),
        inviteEmailCTA: getLanguageString('teams', 'inviteEmailCTA', { teamName: team.name }),
      },
    });

    logger.info(`Sent invite email to '${invite.email}' from team #${team.id}. ✉️`);
  }

  /**
   * Cancel an invite.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Number} teamId - The ID of the team the invite is for.
   * @param {String} email - The email of the invite to cancel.
   *
   * @throws {Standard400Error}
   */
  async cancelInvite(tx, teamId, email) {
    const destroyed = await this.teamInvitesTable(tx).destroy({ team_id: teamId, email });

    if (destroyed.length === 0) {
      throw new Standard400Error([{
        code: ERROR_NOT_FOUND,
        title: `Could not find invite with email '${email}' to cancel.`,
        source: { parameter: 'email' },
      }]);
    }
  }

  /**
   * Update a user's role.
   *
   * This is contained in the `users_teams` table, so it must be performed separately.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Number} teamId - The ID of the team to update the user's role for.
   * @param {Number} userId - The ID of the user to update the role for.
   * @param {String} role - The role to update to.
   */
  async updateRole(tx, teamId, userId, role) {
    if (! this.db) {
      throw new Error('DB not configured for this service.');
    }

    await this.usersTeamsTable(tx).update(
      { team_id: teamId, user_id: userId },
      { role },
    );
  }

  /**
   * Ensure that a user is on a specific team.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Number} teamId - The ID of the team to check.
   * @param {Number} userId - The ID of the user to check.
   * @param {ExtendableError} error - The error message to throw if the user is not on the team.
   *
   * @throws {Standard400Error}
   */
  async valdiateTeam(tx, teamId, userId, error) {
    const memberTeam = await this.usersTeamsTable(tx).find({ team_id: teamId, user_id: userId });

    if (memberTeam.length === 0) {
      throw error;
    }
  }

  /**
   * Remove a user from a team.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Number} teamId - The ID of the team the the user is being removed from.
   * @param {Number} userId - The ID of the user being removed.
   */
  async removeMember(tx, teamId, userId) {
    await this.usersTeamsTable(tx).destroy({ team_id: teamId, user_id: userId });
  }

  /**
   * Adds a user to a team, consuming the invite.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {UserModel} user - The user to add to the team.
   * @param {TeamInviteModel} invite - The invite to consume.
   */
  async completeInvite(tx, user, invite) {
    await this.usersTeamsTable(tx).insert({
      user_id: user.id,
      team_id: invite.teamId,
      role: invite.role.id,
    });

    await this.teamInvitesTable(tx).destroy(invite.id);
  }

  /**
   * Adds team to users.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Array<UserModel>} users - The users to add team to.
   *
   * @return {Array<UserModel>}
   */
  async addTeamDataToUsers(tx, users) {
    const teamData = await this.getTeamDataForUsers(tx, users);

    return users.map((user) => {
      const userTeamData = head(teamData.filter((data) => data.user_id === user.id));

      user.teams = userTeamData
        ? [{
          team: new TeamModel(head(userTeamData.teams)),
          role: new RoleModel({ id: userTeamData.role }),
        }]
        : [];

      return user;
    });
  }

  /**
   * Get the team data for the provided users.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Array<UserModel>} users - The users to get teams for.
   *
   * @return {Array<Object>}
   */
  async getTeamDataForUsers(tx, users) {
    const result = await this.usersTeamsTable(tx)
      .join({
        teams: {
          type: 'INNER',
          on: { id: 'team_id' },
        },
      })
      .find({ 'user_id IN ': users.map(((user) => user.id)) });

    return result;
  }
}

module.exports = {
  TeamMembersService,
};
