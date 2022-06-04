const { get } = require('lodash');
const { PrivateController } = require('#api/Controllers/PrivateController');
const { TeamMembersService } = require('#features/teams/api/services/TeamMembersService');
const {
  TeamMemberValidator,
  TEAM_MEMBER_VALIDATOR_FORM_FIELDS,
} = require('#features/teams/lib/validators/TeamMemberValidator');
const { randString } = require('#lib/Text');
const {
  Standard400Error,
  Standard401Error,
  ERROR_INVITE_MAX_MEMBERS,
  ERROR_NOT_AUTHORIZED,
} = require('#lib/Errors');
const { getConfig, getLanguageString } = require('#lib/Config');

module.exports = class TeamInvitesController extends PrivateController {
  /**
   * Constructor.
   *
   * @param {MassiveJS} db - The MassiveJS db connection.
   * @param {Mailer} mailer - The mailer.
   */
  constructor({ db, mailer } = {}) {
    super({ db, mailer });

    this.teamMembersService = new TeamMembersService({ db, mailer });

    const requireManage = this.requirePermissions(['manage_team']);

    this.router.post(
      '/team/invites',
      this.checkSubscriptionForMemberLimits,
      requireManage,
      this.inviteMember.bind(this),
    );
    this.router.delete(
      '/team/invites/:email',
      this.checkSubscriptionForMemberLimits,
      requireManage,
      this.cancelInvite.bind(this),
    );
  }

  /**
   * @api {post} /team/invites Invite a team member
   * @apiGroup Team
   * @apiName InviteMember
   *
   * @apiSuccessExample {json} Success response:
   *   HTTP/1.1 200 OK
   *   {
   *     "data": {
   *       "member": {
   *         "id": "hashid",
   *         "name": "Daniel McManiel",
   *         "email": "daniel@mcmaniel.com",
   *         "role": "member",
   *       }
   *     }
   *   }
   */
  async inviteMember(req, res) {
    await this.withTransaction(async (tx) => {
      this.validate(req.body, new TeamMemberValidator(TEAM_MEMBER_VALIDATOR_FORM_FIELDS));

      const limit = await this.getMemberLimit(req.subscription);
      if (limit) {
        const memberCount = await this.teamMembersService.count(tx, req.team.id);
        const inviteCount = await this.teamMembersService.countInvites(tx, req.team.id);

        if (memberCount + inviteCount >= limit) {
          throw new Standard400Error([{
            code: ERROR_INVITE_MAX_MEMBERS,
            title: getLanguageString('teams', 'subscriptionMemberLimitError', { limit }),
          }]);
        }
      }

      const token = randString(30);
      const invite = await this.teamMembersService.createInvite(tx, req.team.id, token, req.body);

      await this.teamMembersService.sendInviteMail(req.team, invite, token);

      res.json({ data: { invite } });
    });
  }

  /**
   * @api {delete} /team/invites/:email Cancel a team invite.
   * @apiGroup Team
   * @apiName CancelInvite
   *
   * @apiUse Response204
   */
  async cancelInvite(req, res) {
    await this.withTransaction(async (tx) => {
      await this.teamMembersService.cancelInvite(tx, req.team.id, req.params.email);

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
