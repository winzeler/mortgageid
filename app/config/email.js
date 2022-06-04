const woodConfig = require('@wood/config/email');

/**
 * @type {Object} Email application config values.
 */
module.exports = {
  /**
   * Start with default email config.
   */
  ...woodConfig,

  // Overwrite default configs here
  /**
   * @type {String} The address used to send transactional emails from.
   */
   fromEmail: 'support@mortgageid.com',

   /**
    * @type {String} The address to send support requests to.
    */
   supportEmail: 'support@mortgageid.com',
 
};
