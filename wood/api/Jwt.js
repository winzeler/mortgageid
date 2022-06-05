const Hashids = require('hashids/cjs');
const moment = require('moment');
const { head } = require('lodash');
const logger = require('pino')({ level: process.env.LOG_LEVEL || 'info' });
const { getConfig } = require('#lib/Config');
const { Standard401Error, ERROR_NOT_AUTHORIZED } = require('#lib/Errors');

const hashids = new Hashids(process.env.JWT_HASHID_SALT, getConfig('security', 'jwt.hashidsMinLength'));

const jwtError = new Standard401Error([{
  code: ERROR_NOT_AUTHORIZED,
  title: 'Not authorized.',
}]);

/**
 * Returns a function that performs JWT validation for use in a Strategy.
 *
 * This ensures we can use common validation code for both regular users and admin users.
 *
 * @param {Service} usersService - Users service to load users for validation.
 *
 * @return {Function}
 */
function getJwtValidator(usersService) {
  return async (req, jwtPayload, done) => {
    try {
      const user = await validateJwt(
        usersService,
        jwtPayload,
        req.header('X-CSRF-TOKEN'),
        req.originalUrl,
      );

      if (user) {
        done(null, user, {
          team: head(hashids.decode(jwtPayload.team)),
          role: jwtPayload.role,
        });
      }
      else {
        done(jwtError, false);
      }
    }
    catch (error) {
      // If not found, return (null, false) and trigger 401 Unauthorized, otherwise return error
      done(error.constructor.name === 'NotFoundError' ? null : error, false);
    }
  };
}

/**
 * Load and validate a user based on a JWT.
 *
 * @param {UsersService} usersService - The Users service to use to load the user.
 * @param {Object} jwtPayload - The JWT Payload to validate.
 * @param {String} csrf - The CSRF token to check against.
 * @param {String} url - The request URL.
 *
 * @return {UserModel}
 */
async function validateJwt(usersService, jwtPayload, csrf, url) {
  const user = await usersService.find(null, head(hashids.decode(jwtPayload.sub)));

  if (invalidUserSeries(user, jwtPayload)
    || invalidGlobalSeries(user, jwtPayload)
    || invalidTokenExpiry(user, jwtPayload)
    || invalidCsrfToken(user, jwtPayload, csrf, url)) {
    return false;
  }

  return user;
}

/**
 * If current JWT series for this user doesn't match, user not authorized with this JWT.
 *
 * @param {UserModel} user - The user.
 * @param {Object} jwtPayload - The decoded JWT payload.
 *
 * @return {Boolean}
 */
function invalidUserSeries(user, jwtPayload) {
  const jwtUserSeries = head(hashids.decode(jwtPayload.u_series));
  if (user.jwtSeries !== jwtUserSeries) {
    logger.warn(`User #${user.id} failed login attempt. Invalid user JWT series (received ${jwtUserSeries}, expected ${user.jwtSeries}).`); // eslint-disable-line max-len
    return true;
  }

  return false;
}

/**
 * If current global JWT series doesn't match, user not authorized with this JWT.
 *
 * @param {UserModel} user - The user.
 * @param {Object} jwtPayload - The decoded JWT payload.
 *
 * @return {Boolean}
 */
function invalidGlobalSeries(user, jwtPayload) {
  const jwtGlobalSeries = head(hashids.decode(jwtPayload.g_series));
  if (parseInt(process.env.JWT_GLOBAL_SERIES, 10) !== jwtGlobalSeries) {
    logger.warn(`User #${user.id} failed login attempt. Invalid global JWT series (received ${jwtGlobalSeries}, expected ${process.env.JWT_GLOBAL_SERIES}).`); // eslint-disable-line max-len
    return true;
  }

  return false;
}

/**
 * If token expiry has passed, user not authorized with this JWT.
 *
 * @param {UserModel} user - The user.
 * @param {Object} jwtPayload - The decoded JWT payload.
 *
 * @return {Boolean}
 */
function invalidTokenExpiry(user, jwtPayload) {
  if (moment(jwtPayload.exp * 1000).isBefore(moment())) {
    logger.warn(`User #${user.id} failed login attempt. JWT expired at '${moment(jwtPayload.exp * 1000).format()}'.`); // eslint-disable-line max-len
    return true;
  }

  return false;
}

/**
 * If header token or JWT payload are missing or don't match each other, CSRF attempt.
 *
 * @param {UserModel} user - The user.
 * @param {Object} jwtPayload - The decoded JWT payload.
 * @param {String} headerToken - The CRSF header token to check.
 * @param {String} url - The URL that the request is the source from.
 *
 * @return {Boolean}
 */
function invalidCsrfToken(user, jwtPayload, headerToken, url) {
  // Only check API or websocket calls for CSRF token matches
  // (should be able to load ui, then fail on data reqs)
  if (url === 'ws' || url.substr(0, 4) === '/api') {
    if (! headerToken || ! jwtPayload.csrf || headerToken !== jwtPayload.csrf) {
      logger.warn(`User #${user.id} failed login attempt. JWT has invalid csrf token.`);
      return true;
    }
  }

  return false;
}

module.exports = {
  getJwtValidator,
  validateJwt,
};
