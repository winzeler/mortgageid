const { AdminController } = require('#api/Controllers/AdminController');
const { isFeatureEnabled } = require('#lib/Config');
const { TeamsService } = require('#features/teams/api/services/TeamsService');
const { SubscriptionsService } = require('#features/subscriptions/api/services/SubscriptionsService');
const { ListRequestValidator } = require('#api/ListRequestValidator');
const {
  TeamValidator,
  ADMIN_TEAM_EDIT_FORM_FIELDS,
} = require('#features/teams/lib/validators/TeamValidator');

// Must be strings to pass validation
const DEFAULT_PAGE = '1';
const DEFAULT_PER = '20';

/**
 * @apiDefine TeamListSuccessExample
 * @apiSuccessExample {json} Success response:
 *   HTTP/1.1 200 OK
 *   {
 *     "data": {
 *       "teams": [{
 *         "id": 1,
 *         "name": "BigTeam",
 *         "created_at": "2020-01-16T05:16:45.389Z",
 *         "updated_at": "2020-01-16T05:16:45.389Z",
 *       }]
 *     }
 *   }
 */

module.exports = class AdminTeamsController extends AdminController {
  /**
   * Constructor.
   *
   * @param {MassiveJS} db - The MassiveJS db connection.
   * @param {Mailer} mailer - The mailer.
   */
  constructor({ db, mailer } = {}) {
    super({ db, mailer });

    this.teamsService = new TeamsService({ db, mailer });
    this.subscriptionsService = new SubscriptionsService({ db, mailer });

    this.router.get('/teams', this.list.bind(this));
    this.router.put('/teams/:id(\\d+)', this.update.bind(this));
    this.router.delete('/teams/:id(\\d+)', this.delete.bind(this));
  }

  /**
   * @api {get} /admin/teams Get a list of all teams
   * @apiGroup TeamAdmin
   * @apiName List
   * @apiPermission Admin
   *
   * @apiUse TeamListSuccessExample
   * @apiUse TeamDetailsSuccess
   */
  async list(req, res) {
    await this.withTransaction(async (tx) => {
      this.validate(req.query, new ListRequestValidator());

      let { teams, pages } = await this.getTeamsFromQuery(tx, req.query); // eslint-disable-line prefer-const, max-len

      if (isFeatureEnabled('subscriptions')) {
        teams = await this.subscriptionsService.addSubscriptionToTeams(tx, teams);
      }

      res.json({
        data: { teams },
        meta: { pages },
      });
    });
  }

  /**
   * Gets a page of teams as defined by the provided query, and the number of pages that query
   * returns.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Object} query - The query to get the list from.
   *
   * @return {array<ModelTeam>, Number} - The teams in the current page, and number of pages the
   *                                      query returns.
   */
  async getTeamsFromQuery(tx, query) {
    const {
      page = DEFAULT_PAGE,
      per = DEFAULT_PER,
      search = '',
    } = query;

    const pages = Math.ceil((await this.teamsService.count(tx, { search })) / per);
    const teams = await this.teamsService.getSearchPage(tx, {
      search,
      order: [{
        field: 'created_at',
        direction: 'desc',
      }],
      page: Math.min(page, pages),
      per,
    });

    return { teams, pages };
  }

  /**
   * @api {put} /admin/teams/:id Update a team
   * @apiGroup TeamAdmin
   * @apiName Update
   * @apiPermission Admin
   *
   * @apiParam {Number} id The ID of the team being updated.
   * @apiParam {String} name Name of team being updated.
   * @apiParamExample {json} Request-Example:
   *   {
   *     "name": "New Team Name",
   *   }
   *
   * @apiUse Response204
   *
   * @apiUse GeneralApiErrorExample
   * @apiUse GeneralApiError
   */
  async update(req, res) {
    await this.withTransaction(async (tx) => {
      this.validate(req.body, new TeamValidator(ADMIN_TEAM_EDIT_FORM_FIELDS));

      await this.teamsService.update(tx, req.params.id, req.body, ADMIN_TEAM_EDIT_FORM_FIELDS);

      res.sendStatus(204);
    });
  }

  /**
   * @api {delete} /admin/teams/:id Delete a team
   * @apiGroup TeamAdmin
   * @apiName Delete
   * @apiPermission Admin
   *
   * @apiParam {Number} id The ID of the team being deleted.
   *
   * @apiUse Response204
   *
   * @apiUse GeneralApiErrorExample
   * @apiUse GeneralApiError
   */
  async delete(req, res) {
    await this.withTransaction(async (tx) => {
      await this.teamsService.delete(tx, req.params.id);

      res.sendStatus(204);
    });
  }
};
