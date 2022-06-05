/**
 * @type {Object} Application security config values.
 */
module.exports = {
  /**
   * @type {Array<String>} Paths to redact when logging route requests.
   */
  redactedLoggingPaths: [
    'req.headers',
    'res.headers',
    'req.body.password',
    'req.body.password_repeat',
  ],

  /**
   * @type {Boolean} If the body of POST/PUT/etc requests should be logged.
   */
  shouldLogBody: true,

  /**
   * @type {Number} How many minutes to wait between public emails to prevent flooding.
   */
  emailFloodProtectionMinutes: 5,

  /**
   * @type {Number} Maximum number of failed login attempts before user must "cool down".
   */
  failedLoginMaxAttempts: 10,

  /**
   * @type {Object} Amount of time user must "cool down" before they can attempt to log in again.
   *
   * Format is object literal syntax: https://momentjs.com/docs/#/manipulating/add/
   */
  failedLoginCooldown: { hours: 1 },

  /**
   * @type {Object} JWT options.
   */
  jwt: {
    /**
     * @type {String} The JWT issuer (included in JWT tokens).
     */
    issuer: 'nodewood',

    /**
     * @type {Number} Expire JWT tokens after a week.
     */
    expiryDays: 7,

    /**
     * @type {Number} Minimum length of hashid for user ID in JWT.
     */
    hashidsMinLength: 8,
  },
};
