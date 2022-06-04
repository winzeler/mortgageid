/**
 * Add base Nodewood routes for the users feature.
 *
 * Any routes already defined in appspace will be skipped.
 */

const moment = require('moment');
const { pick, head, isEmpty } = require('lodash');
const { PublicController } = require('#api/Controllers/PublicController');
const { UsersService } = require('#features/users/api/services/UsersService');
const { TeamsService } = require('#features/teams/api/services/TeamsService');
const { TeamMembersService } = require('#features/teams/api/services/TeamMembersService');
const { RoleModel } = require('#features/teams/lib/models/RoleModel');
const {
  UserValidator,
  SIGNUP_FORM_FIELDS,
  LOGIN_FORM_FIELDS,
  PASSWORD_RESET_FORM_FIELDS,
  PASSWORD_CHANGE_FORM_FIELDS,
} = require('#features/users/lib/validators/UserValidator');
const {
  TeamValidator,
  TEAM_VALIDATOR_FORM_FIELDS,
  FORM_FIELDS_TEAM_NAME_OPTIONAL,
} = require('#features/teams/lib/validators/TeamValidator');

const { Standard401Error, ERROR_NOT_ON_TEAM } = require('#lib/Errors');
const { getConfig, isFeatureEnabled } = require('#lib/Config');

/**
 * @apiDefine UserLoginSuccess
 * @apiSuccess {String} jwt The JWT authenticating this user.
 */

/**
 * @apiDefine UserLoginSuccessExample
 * @apiSuccessExample {json} Success response:
 *   HTTP/1.1 200 OK
 *   {
 *     "data": {
 *       "jwt": 'asdf',
 *     }
 *   }
 */
module.exports = class PublicUsersController extends PublicController {
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

    this.router.post('/signup', this.signup.bind(this));
    this.router.post('/login', this.login.bind(this));
    this.router.post('/logout', this.logout.bind(this));
    this.router.post('/reset-password', this.resetPassword.bind(this));
    this.router.post('/change-password', this.changePassword.bind(this));
    this.router.post('/confirm-email', this.confirmEmail.bind(this));
  }

  /**
   * @api {post} /public/signup Sign up
   * @apiGroup User
   * @apiName Signup
   * @apiPermission Public
   *
   * @apiParam {String} name Name of user signing up.
   * @apiParam {String} email Email of user signing up.
   * @apiParam {String} password Password of user signing up.
   * @apiParam {String} password_repeat Password, repeated.
   * @apiParamExample {json} Request-Example:
   *   {
   *     "name": "User Name",
   *     "email": "example@email.com",
   *     "password": "aPassword123!",
   *     "password_repeat": "aPassword123!"
   *   }
   *
   * @apiUse Response204
   *
   * @apiUse GeneralApiErrorExample
   * @apiUse GeneralApiError
   */
  async signup(req, res) {
    req.log.info(`Received signup request from '${req.body.name} <${req.body.email}>'.`);

    await this.withTransaction(async (tx) => {
      const validators = [new UserValidator(SIGNUP_FORM_FIELDS)];

      if (isFeatureEnabled('teams')) {
        const teamFormFields = getConfig('teams', 'teamNameOptional')
          ? FORM_FIELDS_TEAM_NAME_OPTIONAL
          : TEAM_VALIDATOR_FORM_FIELDS;
        validators.push(new TeamValidator(teamFormFields, { aliases: { team_name: 'name' } }));
      }

      this.validate(req.body, validators);

      const teamName = (isFeatureEnabled('teams') && ! isEmpty(req.body.team_name))
        ? req.body.team_name
        : `${req.body.name}'s Team`;

      const user = await this.usersService.create(tx, pick(req.body, SIGNUP_FORM_FIELDS));
      const team = await this.teamsService.create(tx, user, teamName);
      const role = new RoleModel({ id: 'owner' });

      await this.usersService.sendEmailConfirmationMail(user);
      this.usersService.saveLoginCookies(res, user, team, role);

      res.sendStatus(204);
    });
  }

  /**
   * @api {post} /public/login Log in
   * @apiGroup User
   * @apiName Login
   * @apiPermission Public
   *
   * @apiParam {String} email Email of user attempting to log in.
   * @apiParam {String} password Password of user attempting to log in.
   * @apiParamExample {json} Request-Example:
   *   {
   *     "email": "example@email.com",
   *     "password": "aPassword123!"
   *   }
   *
   * @apiUse UserLoginSuccessExample
   * @apiUse UserLoginSuccess
   *
   * @apiUse GeneralApiErrorExample
   * @apiUse GeneralApiError
   */
  async login(req, res) {
    await this.withTransaction(async (tx) => {
      this.validate(req.body, new UserValidator(LOGIN_FORM_FIELDS));

      const user = await this.usersService.login(tx, pick(req.body, LOGIN_FORM_FIELDS));
      const team = head(await this.teamsService.getTeamInfo(tx, user.id));

      if (team === undefined) {
        throw new Standard401Error(
          [{
            code: ERROR_NOT_ON_TEAM,
            title: 'You are not on a team.',
          }],
          { redirectTo: '/no_team' },
        );
      }

      this.usersService.saveLoginCookies(
        res,
        user,
        team.team,
        team.role,
      );

      res.sendStatus(204);
    });
  }

  /**
   * @api {post} /public/logout Log out
   * @apiGroup User
   * @apiName Logout
   * @apiPermission Public
   *
   * @apiUse Response204
   *
   * @apiUse GeneralApiErrorExample
   * @apiUse GeneralApiError
   */
  async logout(req, res) {
    res.clearCookie('jwt');
    res.sendStatus(204);
  }

  /**
   * @api {post} /public/reset-password Send a password reset email
   * @apiGroup User
   * @apiName ResetPassword
   * @apiPermission Public
   *
   * @apiParam {String} email Email of user resetting password.
   * @apiParamExample {json} Request-Example:
   *   {
   *     "email": "example@email.com",
   *   }
   *
   * @apiUse Response204
   *
   * @apiUse GeneralApiErrorExample
   * @apiUse GeneralApiError
   */
  async resetPassword(req, res) {
    await this.withTransaction(async (tx) => {
      this.validate(req.body, new UserValidator(PASSWORD_RESET_FORM_FIELDS));

      const user = head(await this.usersService.findBy(tx, { email: req.body.email }));

      // Don't indicate if no user - we don't want to give away that information to attackers
      if (! user) {
        req.log.warn(`Attempted to reset password for invalid user '${req.body.email}'.`);
        res.sendStatus(204);
        return;
      }

      // If last reset email was sent too recently, silently fail to prevent flooding
      const cutoffTime = moment().subtract(getConfig('security', 'emailFloodProtectionMinutes'), 'minutes'); // eslint-disable-line max-len
      const lastResetAt = moment(user.secureFlags.passwordResetTokenGeneratedAt);
      if (user.secureFlags.passwordResetTokenGeneratedAt && cutoffTime.isBefore(lastResetAt)) {
        req.log.warn(`Flood protection on password reset triggered for user #${user.id}.`);
        res.sendStatus(204);
        return;
      }

      await this.usersService.updatePasswordResetToken(tx, user);
      await this.usersService.sendPasswordResetMail(user);

      res.sendStatus(204);
    });
  }

  /**
   * @api {post} /public/change-password Change password
   * @apiGroup User
   * @apiName ChangePassword
   * @apiPermission Public
   *
   * @apiParam {String} token Token for user changing their password.
   * @apiParam {String} password Password to be changed to.
   * @apiParamExample {json} Request-Example:
   *   {
   *     "token": "asdfg86o4tflgfra",
   *     "password": "my-new-secret-password"
   *   }
   *
   * @apiUse Response204
   *
   * @apiUse GeneralApiErrorExample
   * @apiUse GeneralApiError
   */
  async changePassword(req, res) {
    await this.withTransaction(async (tx) => {
      this.validate(req.body, new UserValidator([
        'token',
        ...PASSWORD_CHANGE_FORM_FIELDS,
      ]));

      await this.usersService.changePasswordFromResetToken(tx, req.body.token, req.body.password);

      res.sendStatus(204);
    });
  }

  /**
   * @api {post} /public/confirm-email Confirm email
   * @apiGroup User
   * @apiName ConfirmEmail
   * @apiPermission Public
   *
   * @apiParam {String} token Token for user confirming their email.
   * @apiParamExample {json} Request-Example:
   *   {
   *     "token": "asdfg86o4tflgfra",
   *   }
   *
   * @apiUse Response204
   *
   * @apiUse GeneralApiErrorExample
   * @apiUse GeneralApiError
   */
  async confirmEmail(req, res) {
    await this.withTransaction(async (tx) => {
      this.validate(req.body, new UserValidator(['token']));
      await this.usersService.confirmEmail(tx, req.body.token);

      res.sendStatus(204);
    });
  }
};
