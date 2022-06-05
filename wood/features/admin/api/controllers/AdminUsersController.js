/**
 * Add base Nodewood routes for the users feature.
 *
 * Any routes already defined in appspace will be skipped.
 */

const { isFeatureEnabled } = require('#lib/Config');
const { AdminController } = require('#api/Controllers/AdminController');
const { UsersService } = require('#features/users/api/services/UsersService');
const { TeamMembersService } = require('#features/teams/api/services/TeamMembersService');
const { SubscriptionsService } = require('#features/subscriptions/api/services/SubscriptionsService');
const { ListRequestValidator } = require('#api/ListRequestValidator');
const {
  UserValidator,
  ADMIN_USER_EDIT_FORM_FIELDS,
} = require('#features/users/lib/validators/UserValidator');

// Must be strings to pass validation
const DEFAULT_PAGE = '1';
const DEFAULT_PER = '20';

/**
 * @apiDefine UserListSuccessExample
 * @apiSuccessExample {json} Success response:
 *   HTTP/1.1 200 OK
 *   {
 *     "data": {
 *       "users": [{
 *         "id": 1,
 *         "name": "Daniel McManiel",
 *         "email": "daniel@mcmaniel.com",
 *         "account_type": "admin",
 *         "last_logged_in_at": "2020-01-16T05:16:45.389Z",
 *         "created_at": "2020-01-16T05:16:45.389Z",
 *         "updated_at": "2020-01-16T05:16:45.389Z",
 *         "flags": {},
 *       }]
 *     }
 *   }
 */

module.exports = class AdminUsersController extends AdminController {
  /**
   * Constructor.
   *
   * @param {MassiveJS} db - The MassiveJS db connection.
   * @param {Mailer} mailer - The mailer.
   */
  constructor({ db, mailer } = {}) {
    super({ db, mailer });

    this.usersService = new UsersService({ db, mailer });
    this.teamMembersService = new TeamMembersService({ db, mailer });
    this.subscriptionsService = new SubscriptionsService({ db, mailer });

    this.router.get('/users', this.list.bind(this));
    this.router.put('/users/:id(\\d+)', this.update.bind(this));
    this.router.post('/users/:id(\\d+)/reset-password', this.resetPassword.bind(this));
    this.router.post('/users/:id(\\d+)/resend-confirmation', this.resendConfirmation.bind(this));
    this.router.delete('/users/:id(\\d+)', this.delete.bind(this));
  }

  /**
   * @api {get} /admin/users Get a list of all users
   * @apiGroup UserAdmin
   * @apiName List
   * @apiPermission Admin
   *
   * @apiUse UserListSuccessExample
   * @apiUse UserDetailsSuccess
   */
  async list(req, res) {
    await this.withTransaction(async (tx) => {
      this.validate(req.query, new ListRequestValidator());

      let { users, pages } = await this.getUsersFromQuery(tx, req.query); // eslint-disable-line prefer-const, max-len

      if (isFeatureEnabled('teams') || isFeatureEnabled('subscriptions')) {
        users = await this.teamMembersService.addTeamDataToUsers(tx, users);

        if (isFeatureEnabled('subscriptions')) {
          users = await this.subscriptionsService.addSubscriptionToUsers(tx, users);
        }
      }

      res.json({
        data: { users },
        meta: { pages },
      });
    });
  }

  /**
   * Gets a page of users as defined by the provided query, and the number of pages that query
   * returns.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Object} query - The query to get the list from.
   *
   * @return {array<UserModel>, Number} - The users in the current page, and number of pages the
   *                                      query returns.
   */
  async getUsersFromQuery(tx, query) {
    const {
      page = DEFAULT_PAGE,
      per = DEFAULT_PER,
      search = '',
    } = query;

    const pages = Math.ceil((await this.usersService.count(tx, {})) / per);
    const users = await this.usersService.getSearchPage(
      tx,
      {
        search,
        order: [{
          field: 'created_at',
          direction: 'desc',
        }],
        page: Math.min(page, pages),
        per,
      },
    );

    return { users, pages };
  }

  /**
   * @api {put} /admin/users/:id Update a user
   * @apiGroup UserAdmin
   * @apiName Update
   * @apiPermission Admin
   *
   * @apiParam {Number} id The ID of the user being updated.
   * @apiParam {String} name Name of user being updated.
   * @apiParam {String} account_type Account type user being updated.
   * @apiParamExample {json} Request-Example:
   *   {
   *     "name": "User Name",
   *     "account_type": "user",
   *   }
   *
   * @apiUse Response204
   *
   * @apiUse GeneralApiErrorExample
   * @apiUse GeneralApiError
   */
  async update(req, res) {
    await this.withTransaction(async (tx) => {
      this.validate(req.body, new UserValidator(ADMIN_USER_EDIT_FORM_FIELDS));

      await this.usersService.update(tx, req.params.id, req.body, ADMIN_USER_EDIT_FORM_FIELDS);

      res.sendStatus(204);
    });
  }

  /**
   * @api {post} /admin/users/:id/reset-password Send a password reset email
   * @apiGroup UserAdmin
   * @apiName ResetPassword
   * @apiPermission Admin
   *
   * @apiParam {Number} id The ID of the user being sent the email.
   *
   * @apiUse Response204
   *
   * @apiUse GeneralApiErrorExample
   * @apiUse GeneralApiError
   */
  async resetPassword(req, res) {
    await this.withTransaction(async (tx) => {
      const user = await this.usersService.find(tx, req.params.id);

      await this.usersService.updatePasswordResetToken(tx, user);
      await this.usersService.sendPasswordResetMail(user);

      res.sendStatus(204);
    });
  }

  /**
   * @api {post} /admin/users/:id/resendConfirmation Send an email confirmation email
   * @apiGroup UserAdmin
   * @apiName ResendConfirmation
   * @apiPermission Admin
   *
   * @apiParam {Number} id The ID of the user being sent the email.
   *
   * @apiUse Response204
   *
   * @apiUse GeneralApiErrorExample
   * @apiUse GeneralApiError
   */
  async resendConfirmation(req, res) {
    await this.withTransaction(async (tx) => {
      const user = await this.usersService.find(tx, req.params.id);

      await this.usersService.updateCreationToken(tx, user);
      await this.usersService.sendEmailConfirmationMail(user);

      res.sendStatus(204);
    });
  }

  /**
   * @api {delete} /admin/users/:id Delete a user
   * @apiGroup UserAdmin
   * @apiName Delete
   * @apiPermission Admin
   *
   * @apiParam {Number} id The ID of the user being deleted.
   *
   * @apiUse Response204
   *
   * @apiUse GeneralApiErrorExample
   * @apiUse GeneralApiError
   */
  async delete(req, res) {
    await this.withTransaction(async (tx) => {
      await this.usersService.delete(tx, req.params.id);

      res.sendStatus(204);
    });
  }
};
