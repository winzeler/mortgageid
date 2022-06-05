const woodConfig = require('@wood/config/admin');

/**
 * @type {Object} Admin console config values.
 *
 * WARNING: Do not put any secure values in this file, as it is included in UI!
 */
module.exports = {
  /**
   * Start with default default admin config.
   */
  ...woodConfig,

  // Overwrite default configs here
};
