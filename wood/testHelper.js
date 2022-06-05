const knex = require('knex');
const moment = require('moment');
const { clean } = require('knex-cleaner'); // eslint-disable-line import/no-extraneous-dependencies
const { UserModel } = require('#features/users/lib/models/UserModel');
const { getConfig } = require('#lib/Config');

const connection = knex({
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST,
    database: process.env.DB_DB,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
  },
  pool: {
    min: 0,
    idleTimeoutMillis: 500,
  },
});

const user = new UserModel({ id: 1, jwt_series: 1 });

// Create valid user owner JWT
const CSRF_TOKEN_USER_ID_1 = 'ekEeeNexYe3';
const jwtOwnerUserId1 = user.generateJWT(process.env.JWT_SECRET, CSRF_TOKEN_USER_ID_1, 1, 'owner');
const COOKIE_JWT_OWNER_ID_1 = `jwt=${jwtOwnerUserId1}`;

// Create expired user JWT
const jwtUserId1Expired = user.generateJWT(
  process.env.JWT_SECRET,
  CSRF_TOKEN_USER_ID_1,
  1,
  'owner',
  { expirationDate: moment().subtract(getConfig('security', 'jwt.expiryDays') + 1, 'days').unix() },
);
const COOKIE_JWT_OWNER_ID_1_EXPIRED = `jwt=${jwtUserId1Expired}`;

// Create valid user member JWT
const jwtMemberUserId1 = user.generateJWT(process.env.JWT_SECRET, CSRF_TOKEN_USER_ID_1, 1, 'member');
const COOKIE_JWT_MEMBER_ID_1 = `jwt=${jwtMemberUserId1}`;

/**
 * Clean the DB between tests.
 */
async function cleanDb() {
  await clean(connection, {
    ignoreTables: ['knex_migrations', 'knex_migrations_lock'],
    mode: 'truncate',
    restartIdentity: true,
  });
}

/**
 * Adds the default user, including team & role.
 *
 * @param {MassiveJS} db - The database to use to add the user.
 * @param {Object} userOverride - Fields to override the user entry with.
 * @param {Object} teamOverride - Fields to override the team entry with.
 * @param {Object} roleOverride - Fields to override the users_teams entry with.
 */
async function addDefaultUser(
  db,
  { userOverride = {}, teamOverride = {}, roleOverride = {} } = {},
) {
  // Add user ID 1 for JWT
  await db.users.insert([{
    id: 1,
    email: 'user@email.com',
    email_confirmed: true,
    password: 'password',
    name: 'name',
    account_type: 'user',
    flags: {},
    jwt_series: 1,
    ...userOverride,
  }]);
  await db.query('ALTER SEQUENCE users_id_seq RESTART WITH 2;');

  // Add team ID 1 for JWT
  await db.teams.insert([{
    id: 1,
    name: 'name',
    currency: 'usd',
    ...teamOverride,
  }]);
  await db.query('ALTER SEQUENCE teams_id_seq RESTART WITH 2;');

  // Add role for user 1
  await db.users_teams.insert([{
    user_id: 1,
    team_id: 1,
    role: 'owner',
    ...roleOverride,
  }]);
}

module.exports = {
  connection,
  cleanDb,
  addDefaultUser,
  COOKIE_JWT_OWNER_ID_1,
  COOKIE_JWT_OWNER_ID_1_EXPIRED,
  COOKIE_JWT_MEMBER_ID_1,
  CSRF_TOKEN_USER_ID_1,
};
