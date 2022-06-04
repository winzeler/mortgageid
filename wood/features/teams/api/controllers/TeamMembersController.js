const Hashids = require('hashids/cjs');
const { head, get } = require('lodash');
const { PrivateController } = require('#api/Controllers/PrivateController');
const { UsersService } = require('#features/users/api/services/UsersService');
const { TeamsService } = require('#features/teams/api/services/TeamsService');
const { TeamMembersService } = require('#features/teams/api/services/TeamMembersService');
const { SubscriptionsService } = require('#features/subscriptions/api/services/SubscriptionsService');
const {
  TeamMemberValidator,
  UPDATE_ROLE_FIELDS,
} = require('#features/teams/lib/validators/TeamMemberValidator');
const {
  Standard400Error,
  Standard401Error,
  ERROR_TEAM_SELF,
  ERROR_INVALID_TEAM,
  ERROR_NOT_AUTHORIZED,
} = require('#lib/Errors');
const { getConfig, getLanguageString } = require('#lib/Config');

const hashids = new Hashids(process.env.JWT_HASHID_SALT, 5);

module.exports = class TeamMembersController extends PrivateController {
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

    const requireManage = this.requirePermissions(['manage_team']);

    this.router.get(
      '/team/members',
      this.checkSubscriptionForMemberLimits,
      this.listMembers.bind(this),
    );
    this.router.put(
      '/team/members/:id(\\w+)',
      this.checkSubscriptionForMemberLimits,
      requireManage,
      this.updateMember.bind(this),
    );
    this.router.delete(
      '/team/members/:id(\\w+)',
      this.checkSubscriptionForMemberLimits,
      requireManage,
      this.removeMember.bind(this),
    );
  }

  /**
   * @api {get} /team/members Get a list of all team members
   * @apiGroup Team
   * @apiName ListMembers
   *
   * @apiSuccessExample {json} Success response:
   *   HTTP/1.1 200 OK
   *   {
   *     "data": {
   *       "members": [{
   *         "id": "hashid",
   *         "name": "Daniel McManiel",
   *         "email": "daniel@mcmaniel.com",
   *         "role": "member",
   *       }]
   *     }
   *   }
   */
  async listMembers(req, res) {
    await this.withTransaction(async (tx) => {
      const members = await this.teamMembersService.getSearchPage(tx, req.team.id);

      // Encode team member IDs so we don't leak sequential user ID information
      members.forEach((member) => member.id = hashids.encode(member.id)); // eslint-disable-line no-return-assign, max-len

      const invites = await this.teamMembersService.getInvites(tx, req.team.id);
      const limit = await this.getMemberLimit(req.subscription);

      res.json({
        data: { members, invites, limit },
      });
    });
  }

  /**
   * @api {put} /team/members Update a team member
   * @apiGroup Team
   * @apiName UpdateMembers
   *
   * If role has changed, ensure user's `jwt_series` is incremented, forcing them to log in again
   * and pick up the new role in their JWT.
   *
   * @apiUse Response204
   */
  async updateMember(req, res) {
    const userId = head(hashids.decode(req.params.id));

    await this.withTransaction(async (tx) => {
      this.validate(req.body, new TeamMemberValidator(UPDATE_ROLE_FIELDS));
      await this.teamMembersService.valdiateTeam(
        tx,
        req.team.id,
        userId,
        new Standard400Error([{
          code: ERROR_INVALID_TEAM,
          title: getLanguageString('teams', 'modifyTeamMemberError'),
        }]),
      );

      if (userId === req.user.id) {
        throw new Standard400Error([{
          code: ERROR_TEAM_SELF,
          title: 'Cannot modify own role.',
        }]);
      }

      await this.teamMembersService.updateRole(tx, req.team.id, userId, req.body.role);
      await this.usersService.incrementJwtSeries(tx, userId);

      res.sendStatus(204);
    });
  }

  /**
   * @api {put} /team/members Remove a team member from a team.
   * @apiGroup Team
   * @apiName UpdateMembers
   *
   * Also update the user's `jwt_series`, to force them to log out.
   *
   * @apiUse Response204
   */
  async removeMember(req, res) {
    const userId = head(hashids.decode(req.params.id));

    await this.withTransaction(async (tx) => {
      this.validate(req.body, new TeamMemberValidator(UPDATE_ROLE_FIELDS));
      await this.teamMembersService.valdiateTeam(
        tx,
        req.team.id,
        userId,
        new Standard400Error([{
          code: ERROR_INVALID_TEAM,
          title: getLanguageString('teams', 'modifyTeamMemberError'),
        }]),
      );

      if (userId === req.user.id) {
        throw new Standard400Error([{
          code: ERROR_TEAM_SELF,
          title: getLanguageString('teams', 'cannotRemoveSelfError'),
        }]);
      }

      await this.teamMembersService.removeMember(tx, req.team.id, userId);
      await this.usersService.incrementJwtSeries(tx, userId);

      res.sendStatus(204);
    });
  }

  /**
   * Middleware to ensure that a subscription is active before managing team, if application has
   * subscriptionMemberLimits enabled.
   *
   * @param {Request} req - The request.
   * @param {Response} res - The response.
   * @param {Function} next - Function to call to pass control.
   *
   * @return {Function}
   */
  checkSubscriptionForMemberLimits(req, res, next) {
    if (getConfig('teams', 'subscriptionMemberLimits')) {
      if (! req.subscription) {
        next(new Standard401Error([{
          code: ERROR_NOT_AUTHORIZED,
          title: 'You require a subscription to access this resource.',
        }], { redirectTo: '/subscription' }));
        return;
      }
    }

    next();
  }

  /**
   * Get the maximum number of team members that may be added to this team, based on the team's
   * subscription.  If team size is not limited by subscription, just return null.
   *
   * @param {SubscriptionModel} subscription - The subscription to check.
   *
   * @return {Number}
   */
  async getMemberLimit(subscription) {
    return getConfig('teams', 'subscriptionMemberLimits')
      ? get(subscription, 'product.maxMembers', null)
      : null;
  }
};
