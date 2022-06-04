const moment = require('moment');
const { resolve } = require('path');
const { hash, compare } = require('bcryptjs');
const { head, omit, get } = require('lodash');
const Hashids = require('hashids/cjs');
const logger = require('pino')({ level: process.env.LOG_LEVEL || 'info' });
const { sendMail } = require('#lib/Email');
const { Service } = require('#api/Service');
const { SECOND_IN_MS, DAY_IN_SECONDS } = require('#lib/Time');
const { ERROR_INVALID_LOGIN } = require('#features/users/lib/validators/UserValidator');
const { getConfig } = require('#lib/Config');
const {
  UserModel,
  FLAG_LAST_FAILED_LOGIN,
  FLAG_FAILED_LOGIN_COUNT,
  SECURE_FLAG_PASSWORD_RESET_TOKEN,
  SECURE_FLAG_PASSWORD_RESET_TOKEN_GENERATED_AT,
  SECURE_FLAG_CREATION_TOKEN,
  SECURE_FLAG_CREATION_TOKEN_GENERATED_AT,
} = require('#features/users/lib/models/UserModel');
const {
  Standard400Error,
  ERROR_UNIQUE,
  ERROR_NOT_FOUND,
  POSTGRES_ERROR_UNIQUE_VIOLATION,
} = require('#lib/Errors');

const hashids = new Hashids(process.env.JWT_HASHID_SALT, getConfig('security', 'jwt.hashidsMinLength'));

class UsersService extends Service {
  /**
   * The constructor.
   *
   * @param {MassiveJS} db - The database to use to create the user.
   * @param {Nodemailer} mailer - The mailer to use to send mail.
   */
  constructor({ db, mailer }) {
    super({ db, mailer });
    this.model = UserModel;
  }

  /**
   * Create a user.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {String} name - The name of the user being created.
   * @param {String} email - The email of the user being created.
   * @param {String} account_type - The account type of the user being created.
   * @param {String} password - The password of the user being created.
   *
   * @return {User}
   */
  async create(tx, { name, email, password, account_type = 'user' } = {}) {
    try {
      const last_logged_in_at = moment().format();
      const userValues = {
        name,
        email: email.toLowerCase(),
        account_type,
        flags: {},
        secure_flags: {
          [SECURE_FLAG_CREATION_TOKEN]: UserModel.generateOneTimeToken(),
          [SECURE_FLAG_CREATION_TOKEN_GENERATED_AT]: moment().format(),
        },
        last_logged_in_at,
      };

      if (password) {
        userValues.password = await hash(password, parseInt(process.env.PASSWORD_SALT_ROUNDS, 10));
      }

      return new this.model(await this.table(tx).insert(userValues));
    }
    catch (error) {
      if (error.code === POSTGRES_ERROR_UNIQUE_VIOLATION) {
        throw new Standard400Error([{
          code: ERROR_UNIQUE,
          title: 'A user already exists with that email address.',
          source: { parameter: 'email' },
        }]);
      }

      throw error;
    }
  }

  /**
   * Attempt to log user in.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {String} email - The email of the user attempting to log in.
   * @param {String} password - The password of the user attempting to log in.
   *
   * @return {UserModel|null}
   */
  async login(tx, { email, password }) {
    const loginError = new Standard400Error([{
      code: ERROR_INVALID_LOGIN,
      title: 'Invalid email address or password.',
    }]);

    const row = await this.table(tx).findOne({ email: email.toLowerCase() });

    // No user with that email address
    if (! row) {
      throw loginError;
    }

    const user = new this.model(row);

    // Check if user is locked out
    if (user.isLockedOut()) {
      // Don't use transaction to update user, thrown error will cause updates to be rolled back
      await this.updateUserFailedLogin(null, user);
      throw loginError;
    }

    // Invalid password, update failed login count
    if (! await compare(password, row.password)) {
      // Don't use transaction to update user, thrown error will cause updates to be rolled back
      await this.updateUserFailedLogin(null, user);
      throw loginError;
    }

    // Update user with current login time & clear failed login count
    await this.table(tx).update(row.id, {
      last_logged_in_at: moment().format(),
      flags: omit(user.flags, [
        FLAG_LAST_FAILED_LOGIN,
        FLAG_FAILED_LOGIN_COUNT,
      ]),
    });

    return user;
  }

  /**
   * Update a user's failed login flags.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {UserModel} user - The user to update.
   *
   * @return {UserModel}
   */
  async updateUserFailedLogin(tx, user) {
    const failedTimes = get(user.flags, FLAG_FAILED_LOGIN_COUNT, 0) + 1;
    if (failedTimes >= getConfig('security', 'failedLoginMaxAttempts')) {
      logger.warn(`User '${user.email} has failed at logging in ${failedTimes} times.`);
    }
    else {
      logger.warn(`User '${user.email} is locked out and has failed at logging in ${failedTimes} times.`);
    }

    user.flags[FLAG_LAST_FAILED_LOGIN] = moment().format();
    user.flags[FLAG_FAILED_LOGIN_COUNT] = failedTimes;

    await this.table(tx).update(user.id, { flags: user.flags });

    return user;
  }

  /**
   * Updates a user with a password reset token.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {UserModel} user - The user to update.
   *
   * @return {UserModel}
   */
  async updatePasswordResetToken(tx, user) {
    user.secureFlags[SECURE_FLAG_PASSWORD_RESET_TOKEN] = UserModel.generateOneTimeToken();
    user.secureFlags[SECURE_FLAG_PASSWORD_RESET_TOKEN_GENERATED_AT] = moment().format();

    await this.table(tx).update(user.id, { secure_flags: user.secureFlags });

    return user;
  }

  /**
   * Updates a user with a creation token.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {UserModel} user - The user to update.
   *
   * @return {UserModel}
   */
  async updateCreationToken(tx, user) {
    user.secureFlags[SECURE_FLAG_CREATION_TOKEN] = UserModel.generateOneTimeToken();
    user.secureFlags[SECURE_FLAG_CREATION_TOKEN_GENERATED_AT] = moment().format();

    await this.table(tx).update(user.id, { secure_flags: user.secureFlags });

    return user;
  }

  /**
   * Sends an email with password reset link.
   *
   * @param {UserModel} user - The user to email.
   *
   * @return {UserModel}
   */
  async sendPasswordResetMail(user) {
    await sendMail(this.mailer, {
      from: `${getConfig('app', 'name')} <${getConfig('email', 'fromEmail')}>`,
      to: user.email,
      subject: `${getConfig('app', 'name')}: Reset your password`,
      template: resolve(__dirname, '../emails/ResetPassword.ejs'),
      data: {
        token: user.secureFlags[SECURE_FLAG_PASSWORD_RESET_TOKEN],
        userName: user.name,
        appName: getConfig('app', 'name'),
        appUrl: getConfig('app', 'url'),
      },
    });

    logger.info(`Sent reset password email to '${user.email}'. ✉️`);
  }

  /**
   * Sends an email with email confirmation link.
   *
   * @param {UserModel} user - The user to email.
   *
   * @return {UserModel}
   */
  async sendEmailConfirmationMail(user) {
    await sendMail(this.mailer, {
      from: `${getConfig('app', 'name')} <${getConfig('email', 'fromEmail')}>`,
      to: user.email,
      subject: `${getConfig('app', 'name')}: Confirm your email`,
      template: resolve(__dirname, '../emails/ConfirmEmail.ejs'),
      data: {
        token: user.secureFlags[SECURE_FLAG_CREATION_TOKEN],
        userName: user.name,
        appName: getConfig('app', 'name'),
        appUrl: getConfig('app', 'url'),
      },
    });

    logger.info(`Sent email confirmation email to '${user.email}'. ✉️`);
  }

  /**
   * Change user's password, given a supposedly-valid reset token.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {String} token - The token to use to find the user.
   * @param {String} password - The password to change to.
   *
   * @return {UserModel}
   */
  async changePasswordFromResetToken(tx, token, password) {
    const row = head(await this.table(tx).where(`secure_flags->>'${SECURE_FLAG_PASSWORD_RESET_TOKEN}' = $1`, [token]));

    if (! row) {
      logger.warn(`No user found for password reset token '${token}'.`);
      throw new Standard400Error([{
        code: ERROR_NOT_FOUND,
        source: { parameter: 'password' },
        title: 'Could not find a user with that password reset token.',
      }]);
    }

    const generatedAt = moment(row.secure_flags[SECURE_FLAG_PASSWORD_RESET_TOKEN_GENERATED_AT]);
    const lastValidTime = moment().subtract(1, 'day');

    if (generatedAt.isBefore(lastValidTime)) {
      logger.warn(`Password reset token for user #${row.id} is too old.`);
      throw new Standard400Error([{
        code: ERROR_NOT_FOUND,
        source: { parameter: 'password' },
        title: 'The password reset token provided has expired.',
      }]);
    }

    // Make sure to clear token, now that it has been used.
    await this.table(tx).update(row.id, {
      password: await hash(password, parseInt(process.env.PASSWORD_SALT_ROUNDS, 10)),
      jwt_series: row.jwt_series + 1,
      secure_flags: omit(row.secure_flags, [
        SECURE_FLAG_PASSWORD_RESET_TOKEN,
        SECURE_FLAG_PASSWORD_RESET_TOKEN_GENERATED_AT,
      ]),
    });

    return new this.model(row);
  }

  /**
   * Increment a user's `jwt_series` counter.
   *
   * @param {Number} id - The ID of the user to increment the jwt_series counter for.
   */
  async incrementJwtSeries(tx, id) {
    await this.table(tx).update(id, { $set: { jwt_series: 'jwt_series + 1' } });
  }

  /**
   * Confirms a user's email address.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {String} token - The token for the user to confirm email for.
   *
   * @return {UserModel}
   */
  async confirmEmail(tx, token) {
    const row = head(await this.table(tx).where(`secure_flags->>'${SECURE_FLAG_CREATION_TOKEN}' = $1`, [token]));

    if (! row) {
      logger.warn(`No user found for creation token '${token}'.`);
      throw new Standard400Error([{
        code: ERROR_NOT_FOUND,
        title: 'Could not find a user with that creation token.',
      }]);
    }

    const generatedAt = moment(row.secure_flags[SECURE_FLAG_CREATION_TOKEN_GENERATED_AT]);
    const lastValidTime = moment().subtract(1, 'day');

    if (generatedAt.isBefore(lastValidTime)) {
      logger.warn(`Creation token for user #${row.id} is too old.`);
      throw new Standard400Error([{
        code: ERROR_NOT_FOUND,
        title: 'The creation token provided has expired.',
      }]);
    }

    // Make sure to clear token, now that it has been used.
    await this.table(tx).update(row.id, {
      email_confirmed: true,
      secure_flags: omit(row.secure_flags, [
        SECURE_FLAG_CREATION_TOKEN,
        SECURE_FLAG_CREATION_TOKEN_GENERATED_AT,
      ]),
    });

    return new this.model(row);
  }

  /**
   * Gets a page of users based on search query.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {String} search - The text to search for, either in name or email.
   * @param {Object} order - The order to sort the search page.
   * @param {Number} page - The page of users to get.
   * @param {Number} per - The number of users to get per page.
   *
   * @return {Array<UserModel>}
   */
  async getSearchPage(tx, { search, order, page, per } = {}) {
    return this.findBy(tx, this.getSearchQuery(search), { order, page, per });
  }

  /**
   * Gets the search query for searching for users.
   *
   * @param {String} search - The term to search for.
   *
   * @return {Object}
   */
  getSearchQuery(search) {
    return search
      ? { or: [
        { 'name ilike': `%${search}%` },
        { 'email ilike': `%${search}%` },
      ] }
      : {};
  }

  /**
   * Sends a support request message to the support email address.
   *
   * @param {UserModel} user - The user to email.
   * @param {String} message - The support request message to send.
   * @param {String} title - The title of the email.
   */
  async sendSupportRequest(user, { message, title = 'Support Request' }) {
    await sendMail(this.mailer, {
      from: `${getConfig('app', 'name')} <${getConfig('email', 'fromEmail')}>`,
      to: getConfig('email', 'supportEmail'),
      subject: `${getConfig('app', 'name')} - ${title}`,
      text: `Message: ${message}\n\nUser: ${user.name} (${user.email})`,
    });

    logger.info(`Sent support request email from '${user.email}'. ✉️`);
  }

  /**
   * Save login cookies.
   *
   * CSRF token is available to browser and must be set in headers to prevent CSRF.
   * JWT is NOT available to browser, and is thus safe from XSS.
   *
   * @param {Response} res - The Express Response to set the cookie in.
   * @param {UserModel} user - The user to generate the JWT for.
   * @param {TeamModel} team - The team the user is logged in as.
   * @param {RoleModel} role - The role the user has within the team.
   */
  saveLoginCookies(res, user, team, role) {
    const csrfToken = hashids.encode(
      Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER)),
    );
    res.cookie('csrf', csrfToken, {
      maxAge: getConfig('security', 'jwt.expiryDays') * DAY_IN_SECONDS * SECOND_IN_MS,
      sameSite: 'Strict',
      secure: true,
    });

    const jwt = user.generateJWT(process.env.JWT_SECRET, csrfToken, team.id, role.id);
    res.cookie('jwt', jwt, {
      maxAge: getConfig('security', 'jwt.expiryDays') * DAY_IN_SECONDS * SECOND_IN_MS,
      sameSite: 'Strict',
      httpOnly: true,
      secure: true,
    });
  }
}

module.exports = {
  UsersService,
};
