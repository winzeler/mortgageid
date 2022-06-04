const { PrivateController } = require('#api/Controllers/PrivateController');
const { TeamsService } = require('#features/teams/api/services/TeamsService');
const { TeamValidator, TEAM_VALIDATOR_FORM_FIELDS } = require('#features/teams/lib/validators/TeamValidator');

module.exports = class TeamsController extends PrivateController {
  /**
   * Constructor.
   *
   * @param {MassiveJS} db - The MassiveJS db connection.
   * @param {Mailer} mailer - The mailer.
   */
  constructor({ db, mailer } = {}) {
    super({ db, mailer });

    this.teamsService = new TeamsService({ db, mailer });

    const requireManage = this.requirePermissions(['manage_team']);

    this.router.put(
      '/team',
      requireManage,
      this.updateTeam.bind(this),
    );
  }

  /**
   * @api {put} /team Updates the current team
   * @apiGroup Team
   * @apiName UpdateTeam
   *
   * @apiUse Response204
   */
  async updateTeam(req, res) {
    await this.withTransaction(async (tx) => {
      this.validate(req.body, new TeamValidator(TEAM_VALIDATOR_FORM_FIELDS));
      await this.teamsService.update(tx, req.team.id, req.body, TEAM_VALIDATOR_FORM_FIELDS);

      res.sendStatus(204);
    });
  }
};
