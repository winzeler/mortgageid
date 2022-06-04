const { AdminController } = require('#api/Controllers/AdminController');
const { DashboardService } = require('#features/admin/api/services/DashboardService');
const { isFeatureEnabled } = require('#lib/Config');

module.exports = class AdminDashboardController extends AdminController {
  /**
   * Constructor.
   *
   * @param {MassiveJS} db - The MassiveJS db connection.
   * @param {Mailer} mailer - The mailer.
   */
  constructor({ db, mailer } = {}) {
    super({ db, mailer });

    this.dashboardService = new DashboardService({ db });

    this.router.get('/dashboard', this.list.bind(this));
  }

  /**
   * @api {get} /admin/dashbaord Lists dashboard data
   * @apiGroup AdminDashboard
   * @apiName List
   * @apiPermission Admin
   * @apiSuccessExample {json} Success response:
   *   HTTP/1.1 200 OK
   *   {
   *     "data": {
   *       "usersTotal": 52,
   *       "usersNew": 12,
   *       "mrrTotal": 1792.58,
   *       "mrrNew": 485.23,
   *       "recentUsers": [{
   *         "name": "",
   *         "email": "",
   *         "plan": "",
   *         "mrr": 150,
   *         "joined": "",
   *       }],
   *     }
   *   }
   */
  async list(req, res) {
    await this.withTransaction(async (tx) => {
      res.json({
        data: isFeatureEnabled('teams')
          ? await this.dashboardService.getTeamData(tx)
          : await this.dashboardService.getUserData(tx),
      });
    });
  }
};
