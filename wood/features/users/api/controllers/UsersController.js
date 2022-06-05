/**
 * Add base Nodewood routes for the users feature.
 *
 * Any routes already defined in appspace will be skipped.
 */

const { hash } = require('bcryptjs');
const { omit, without, pick } = require('lodash');
const { PrivateController } = require('#api/Controllers/PrivateController');
const { isFeatureEnabled } = require('#lib/Config');
const { UsersService } = require('#features/users/api/services/UsersService');
const { SubscriptionsService } = require('#features/subscriptions/api/services/SubscriptionsService');
const {
  UserValidator,
  USER_UPDATE_FORM_FIELDS,
} = require('#features/users/lib/validators/UserValidator');

/**
 * @apiDefine UserDetailsSuccessExample
 * @apiSuccessExample {json} Success response:
 *   HTTP/1.1 200 OK
 *   {
 *     "data": {
 *       "user": {
 *         "id": 1,
 *         "name": "Daniel McManiel",
 *         "email": "daniel@mcmaniel.com",
 *         "account_type": "admin",
 *         "last_logged_in_at": "2020-01-16T05:16:45.389Z",
 *         "created_at": "2020-01-16T05:16:45.389Z",
 *         "updated_at": "2020-01-16T05:16:45.389Z",
 *         "flags": {},
 *       }
 *     }
 *   }
 */

module.exports = class UsersController extends PrivateController {
  /**
   * Constructor.
   *
   * @param {MassiveJS} db - The MassiveJS db connection.
   * @param {Mailer} mailer - The mailer.
   */
  constructor({ db, mailer } = {}) {
    super({ db, mailer });

    this.usersService = new UsersService({ db, mailer });
    this.subscriptionsService = new SubscriptionsService({ db, mailer });

    this.router.get('/users/me', this.me.bind(this));
    this.router.post('/users/resend-confirmation', this.resendConfirmation.bind(this));
    this.router.put('/users', this.update.bind(this));
    this.router.post('/users/support', this.sendSupportRequest.bind(this));
  }

  /**
   * @api {get} /users/me Get logged-in user's information
   * @apiGroup User
   * @apiName Me
   *
   * @apiUse UserDetailsSuccessExample
   */
  async me(req, res) {
    const data = {
      user: req.user,
      team: req.team,
      role: req.role,
    };

    if (isFeatureEnabled('subscriptions')) {
      data.subscription = req.subscription;
    }

    res.json({ data });
  }

  /**
   * @api {post} /users/resend-confirmation Send an email confirmation email
   * @apiGroup User
   * @apiName ResendConfirmation
   *
   * @apiUse Response204
   *
   * @apiUse GeneralApiErrorExample
   * @apiUse GeneralApiError
   */
  async resendConfirmation(req, res) {
    await this.withTransaction(async (tx) => {
      await this.usersService.updateCreationToken(tx, req.user);
      await this.usersService.sendEmailConfirmationMail(req.user);

      res.sendStatus(204);
    });
  }

  /**
   * @api {post} /users Updates the current user
   * @apiGroup User
   * @apiName Update
   *
   * @apiUse Response204
   *
   * @apiUse GeneralApiErrorExample
   * @apiUse GeneralApiError
   */
  async update(req, res) {
    await this.withTransaction(async (tx) => {
      const userValues = omit(req.body, 'password_repeat');
      const formFields = userValues.password
        ? USER_UPDATE_FORM_FIELDS
        : without(USER_UPDATE_FORM_FIELDS, 'password', 'password_repeat');
      userValues.password = userValues.password
        ? await hash(userValues.password, parseInt(process.env.PASSWORD_SALT_ROUNDS, 10))
        : '';

      this.validate(req.body, new UserValidator(formFields));
      await this.usersService.update(tx, req.user.id, userValues, formFields);

      res.sendStatus(204);
    });
  }

  /**
   * @api {post} /users/support Sends a request for support.
   * @apiGroup User
   * @apiName Support
   *
   * @apiUse Response204
   *
   * @apiUse GeneralApiErrorExample
   * @apiUse GeneralApiError
   */
  async sendSupportRequest(req, res) {
    await this.usersService.sendSupportRequest(req.user, pick(req.body, ['message']));
    res.sendStatus(204);
  }
};
