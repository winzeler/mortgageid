const Hashids = require('hashids/cjs');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const { get, head } = require('lodash');
const { Model } = require('#lib/Model');
const { randString } = require('#lib/Text');
const {
  FieldNumber,
  FieldString,
  FieldDate,
  FieldEnum,
  FieldBoolean,
  FieldEmail,
  FieldCustom,
} = require('#lib/Fields');
const { getConfig } = require('#lib/Config');
const { TeamModel } = require('#features/teams/lib/models/TeamModel');
const { RoleModel } = require('#features/teams/lib/models/RoleModel');

const hashids = new Hashids(process.env.JWT_HASHID_SALT, getConfig('security', 'jwt.hashidsMinLength'));

const FLAG_LAST_FAILED_LOGIN = 'lastFailedLogin';
const FLAG_FAILED_LOGIN_COUNT = 'failedLoginCount';
const SECURE_FLAG_PASSWORD_RESET_TOKEN = 'passwordResetToken';
const SECURE_FLAG_PASSWORD_RESET_TOKEN_GENERATED_AT = 'passwordResetTokenGeneratedAt';
const SECURE_FLAG_CREATION_TOKEN = 'creationToken';
const SECURE_FLAG_CREATION_TOKEN_GENERATED_AT = 'creationTokenGeneratedAt';

/**
 * @type {String} Admin account type.
 */
const ACCOUNT_TYPE_ADMIN = 'admin';

/**
 * @type {String} User acount type.
 */
const ACCOUNT_TYPE_USER = 'user';

/**
 * @type {Object} Field configuration.
 */
const USER_MODEL_FIELDS = {
  id: new FieldNumber({ label: 'ID' }),
  name: new FieldString({ label: 'Name' }),
  email: new FieldEmail({
    label: 'Email',
    mobileValueClasses: ['overflow-ellipsis', 'overflow-hidden'],
  }),
  emailConfirmed: new FieldBoolean({
    label: 'Email Confirmed',
    desktopValueClasses: ['text-center'],
  }),
  team: new FieldCustom({
    label: 'Team',
    desktopValueClasses: ['text-center'],
    valueFn: (team) => (team ? team.value('name') : 'None'),
  }),
  role: new FieldCustom({
    label: 'Role',
    desktopValueClasses: ['text-center'],
    valueFn: (role) => (role ? role.value('name') : 'None'),
  }),
  accountType: new FieldEnum({
    label: 'Account Type',
    enumList: {
      [ACCOUNT_TYPE_ADMIN]: 'Admin',
      [ACCOUNT_TYPE_USER]: 'User',
    },
    desktopValueClasses: ['text-center'],
  }),
  lastLoggedInAt: new FieldDate({
    label: 'Last Logged In At',
    desktopValueClasses: ['text-center'],
  }),
  createdAt: new FieldDate({
    label: 'Created At',
    desktopValueClasses: ['text-center'],
  }),
  updatedAt: new FieldDate({ label: 'Updated At' }),
  subscription: new FieldCustom({
    label: 'Subscription',
    desktopValueClasses: ['text-center'],
    valueFn: (t, i) => (i.teams.length ? head(i.teams).team.value('subscriptionName') : 'None'),
  }),
};

class UserModel extends Model {
  /**
   * Generates a random string to act as a token for general 1-time use.
   *
   * @return {String}
   */
  static generateOneTimeToken() {
    return randString(30);
  }

  /**
   * Constructor.
   *
   * @param {Number} id - The ID of this user.
   * @param {String} name - The full name of this user.
   * @param {String} email - The email of this user.
   * @param {Boolean} email_confirmed - If the user's email address has been confirmed.
   * @param {String} account_type - The account type of this user.
   * @param {Date} last_logged_in_at - The date the user last logged in.
   * @param {Date} created_at - The date the user was created.
   * @param {Date} updated_at - The date the user was last updated.
   * @param {Object} flags - The miscellaneous flags that apply to this user.
   * @param {Object} secure_flags - Flags that apply to this user but must not be sent via the API.
   * @param {Number} jwt_series - The user JWT series.
   * @param {Array<{team: Object, role: Object}>} teams - The teams the user is on & role they have.
   */
  constructor({
    id,
    name,
    email,
    email_confirmed,
    account_type,
    last_logged_in_at,
    created_at,
    updated_at,
    flags,
    secure_flags,
    jwt_series,
    teams = [],
  } = {}) {
    super(USER_MODEL_FIELDS);

    this.id = id;
    this.name = name;
    this.email = email;
    this.emailConfirmed = email_confirmed;
    this.accountType = account_type;
    this.lastLoggedInAt = last_logged_in_at;
    this.createdAt = moment(created_at);
    this.updatedAt = moment(updated_at);
    this.flags = flags || {};
    this.secureFlags = secure_flags || {};
    this.jwtSeries = jwt_series;
    // Password is not read into model for security
    this.teams = teams.map((teamData) => ({
      team: new TeamModel(teamData.team),
      role: new RoleModel(teamData.role),
    }));
  }

  /**
   * Returns the value of the model for the provided key.
   *
   * Overrides 'team' and 'role' to return the first team/role for now.
   *
   * @param {String} key - The key to retrieve the value for.
   *
   * @return {Mixed}
   */
  keyValue(key) {
    switch (key) {
      case 'team': return get(head(this.teams), 'team');
      case 'role': return get(head(this.teams), 'role');
      default: return this[key];
    }
  }

  /**
   * Convert user to JSON.
   *
   * @return {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      email_confirmed: this.emailConfirmed,
      account_type: this.accountType,
      last_logged_in_at: this.lastLoggedInAt,
      created_at: this.createdAt.format(),
      updated_at: this.updatedAt.format(),
      flags: this.flags,
      // Secure flags are not serialized for security
      // JWT series is not serialized for security
      // Password is not serialized for security
      teams: this.teams,
      // Subscription is derived from teams and is not necessary to add to JSON
    };
  }

  /**
   * Generate JWT for this user.
   *
   * @param {String} secret - The secret to sign the JWT with.
   * @param {String} csrf - The csrf token for this user to save in the JWT.
   * @param {Number} team - The ID of the team the user is logged in with.
   * @param {String} role - The role of the user on their current team.
   * @param {Number} expirationDate - An optional manually-choosable expiration date for the JWT.
   *                                  Unix timestamp, in seconds.
   *
   * @return {String}
   */
  generateJWT(secret, csrf, team, role, { expirationDate } = {}) {
    return jwt.sign({
      iss: getConfig('security', 'jwt.issuer'),
      sub: hashids.encode(this.id),
      exp: expirationDate || moment().add(getConfig('security', 'jwt.expiryDays'), 'days').unix(),
      u_series: hashids.encode(this.jwtSeries),
      g_series: hashids.encode(parseInt(process.env.JWT_GLOBAL_SERIES, 10)),
      csrf,
      team: hashids.encode(team),
      role,
    }, secret);
  }

  /**
   * If this user is an admin user (and not a regular User).
   *
   * @return {Boolean}
   */
  isAdmin() {
    return this.accountType === ACCOUNT_TYPE_ADMIN;
  }

  /**
   * If the user has attempted to log in too many times in too short a period.
   *
   * @return {Boolean}
   */
  isLockedOut() {
    const now = moment();
    const userFailedLoginAttempts = get(this.flags, FLAG_FAILED_LOGIN_COUNT, 0);
    const coolDownTime = moment(get(this.flags, FLAG_LAST_FAILED_LOGIN))
      .add(getConfig('security', 'failedLoginCooldown'));

    return (userFailedLoginAttempts >= getConfig('security', 'failedLoginMaxAttempts')
      && now.isBefore(coolDownTime));
  }

  /**
   * If a team has a specific flag set.
   *
   * @param {String} flag - The name of the flag to check.
   * @param {String} value - If set, a value the flag must be set to in order to return true.
   *
   * @return {Boolean}
   */
  hasFlag(flag, value = null) {
    if (Object.keys(this.flags).includes(flag)) {
      return value === null ? true : this.flags[flag] === value;
    }

    if (Object.keys(this.secureFlags).includes(flag)) {
      return value === null ? true : this.secureFlags[flag] === value;
    }

    return false;
  }
}

module.exports = {
  UserModel,
  USER_MODEL_FIELDS,
  ACCOUNT_TYPE_ADMIN,
  ACCOUNT_TYPE_USER,
  FLAG_LAST_FAILED_LOGIN,
  FLAG_FAILED_LOGIN_COUNT,
  SECURE_FLAG_PASSWORD_RESET_TOKEN,
  SECURE_FLAG_PASSWORD_RESET_TOKEN_GENERATED_AT,
  SECURE_FLAG_CREATION_TOKEN,
  SECURE_FLAG_CREATION_TOKEN_GENERATED_AT,
};
