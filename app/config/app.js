// MUST use relative include in this file to avoid confusing resolver
const woodConfig = require('../../wood/config/app');

/**
 * @type {Object} Common application config values.
 *
 * WARNING: Do not put any secure values in this file, as it is included in UI!
 */
module.exports = {
  /**
   * Start with default app config.
   */
  ...woodConfig,

  /**
   * @type {String} Common name for application.
   */
  name: 'MortgageId',

  // Overwrite default configs here
  /**
   * @type {Object} Enabled features.
   */
  features: {
    app: [],

    /**
     * @type {Array<String>} List of enabled Nodewood features.
     */
    wood: [
      'samples',
      'users',
      'admin',
      //'subscriptions',
      //'teams',
    ],
  },
};
