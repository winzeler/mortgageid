const woodConfig = require('@wood/config-api/email');

/**
 * @type {Object} API email config values.
 *
 * WARNING: Do not put any secure values in this file, as it can be included in UI!
 */
module.exports = {
  /**
   * Start with default default api email config.
   */
  ...woodConfig,

  // Overwrite default configs here
};
