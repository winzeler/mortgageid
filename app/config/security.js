const woodConfig = require('@wood/config/security');

/**
 * @type {Object} Application security config values.
 */
module.exports = {
  /**
   * Start with default security config.
   */
  ...woodConfig,

  /**
   * @type {Object} JWT options.
   */
  jwt: {
    ...woodConfig.jwt,

    /**
     * @type {String} The JWT issuer (included in JWT tokens).
     */
    issuer: 'mortgage-id',
  },

  // Overwrite default configs here
};
