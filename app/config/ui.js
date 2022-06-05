const woodConfig = require('@wood/config/ui');
// import CustomVueTemplateComponent from '#place/place';

/**
 * @type {Object} UI/Vue configuration values.
 *
 * WARNING: Do not put any secure values in this file, as it is included in UI!
 */
module.exports = {
  /**
   * Start with default UI config.
   */
  ...woodConfig,

  /**
   * @type {Array<Component>} Vue components that can act as the outer application template for
   * certain routes.
   */
  templateComponents: {
    // CustomVueTemplateComponent
  },

  // Overwrite default configs here
};
