const { head, get, set } = require('lodash');
const { PublicController } = require('#api/Controllers/PublicController');
const { UsersService } = require('#features/users/api/services/UsersService');
const { TeamsService } = require('#features/teams/api/services/TeamsService');
const { TeamMembersService } = require('#features/teams/api/services/TeamMembersService');
const { SubscriptionsService } = require('#features/subscriptions/api/services/SubscriptionsService');
const {
  UserValidator,
  ACCEPT_INVITE_NEW_USER_FIELDS,
  ACCEPT_INVITE_EXISTING_USER_FIELDS,
  ERROR_INVALID_LOGIN,
} = require('#features/users/lib/validators/UserValidator');
const {
  Standard401Error,
  ERROR_ALREADY_ON_TEAM,
} = require('#lib/Errors');
const { getLanguageString } = require('#lib/Config');

module.exports = class PublicTeamsController extends PublicController {
  /**
   * Constructor.
   *
   * @param {MassiveJS} db - The MassiveJS db connection.
   * @param {Mailer} mailer - The mailer.
   */
  constructor({ db, mailer } = {}) {
    super({ db, mailer });

    this.usersService = new UsersService({ db, mailer });
    this.teamsService = new TeamsService({ db, mailer });
    this.teamMembersService = new TeamMembersService({ db, mailer });
    this.subscriptionsService = new SubscriptionsService({ db, mailer });

    this.router.get(
      '/team/invites/:token',
      this.getInvite.bind(this),
    );
    this.router.post(
      '/team/invites/:token',
      this.acceptInvite.bind(this),
    );
  }

  /**
   * @api {get} /public/team/invites/:token Load info about a team invite.
   * @apiGroup Team
   * @apiName GetInvite
   *
   * @apiUse Response204
   */
  async getInvite(req, res) {
    await this.withTransaction(async (tx) => {
      const invite = await this.teamMembersService.findInvite(tx, req.params.token);

      const team = await this.teamsService.find(tx, invite.teamId);
      const user = head(await this.usersService.findBy(tx, { email: invite.email }));

      await this.ensureUserIsNotOnTeam(tx, user, invite);

      res.json({
        data: {
          invite,
          team_name: team.name,
          user_exists: Boolean(user),
        },
      });
    });
  }

  /**
   * @api {put} /public/team/invites/:token Accept a team invite.
   * @apiGroup Team
   * @apiName AcceptInvite
   *
   * @apiUse Response204
   */
  async acceptInvite(req, res) {
    await this.withTransaction(async (tx) => {
      const invite = await this.teamMembersService.findInvite(tx, req.params.token);

      let user = head(await this.usersService.findBy(tx, { email: invite.email }));
      const team = await this.teamsService.find(tx, invite.teamId);

      if (user) {
        this.validate(req.body, new UserValidator(ACCEPT_INVITE_EXISTING_USER_FIELDS));
        try {
          await this.usersService.login(tx, { email: invite.email, password: req.body.password });
        }
        catch (error) {
          // Modify error title to remove mention of email, since user cannot modify it
          if (get(error, 'errors[0].code') === ERROR_INVALID_LOGIN) {
            set(error, 'errors[0].title', 'Invalid password.');
          }

          throw error;
        }
      }
      else {
        this.validate(req.body, new UserValidator(ACCEPT_INVITE_NEW_USER_FIELDS));

        user = await this.usersService.create(tx, {
          name: req.body.name,
          email: invite.email,
          password: req.body.password,
        });
        await this.usersService.sendEmailConfirmationMail(user);
      }

      await this.teamMembersService.completeInvite(tx, user, invite);
      this.usersService.saveLoginCookies(res, user, team, invite.role);

      res.sendStatus(204);
    });
  }

  /**
   * Check if a user is already on the team they are trying to accept an invite for.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {UserModel} user - The user to check.
   * @param {TeamInviteModel} invite - The invite to use to check.
   *
   * @throws {Standard401Error}
   */
  async ensureUserIsNotOnTeam(tx, user, invite) {
    if (user) {
      const teamInfo = await this.teamsService.getTeamInfo(tx, user.id);
      if (teamInfo.some((info) => info.team.id === invite.teamId)) {
        // Make sure this happens outside of transaction or delete will be rolled back by error
        await this.teamMembersService.cancelInvite(null, invite.teamId, invite.email);

        throw new Standard401Error([{
          code: ERROR_ALREADY_ON_TEAM,
          title: getLanguageString('teams', 'alreadyOnTeamError'),
        }]);
      }
    }
  }
};
