const woodConfig = require('@wood/config-api/email');
const sl = require('nodemailer-smtp-transport');

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
  transportConfig: sl({
    host: process.env.SOCKETLABS_SMTP,
    port: 587,
    secure: false,
    auth: {
      user: process.env.SOCKETLABS_USER,
      pass: process.env.SOCKETLABS_PASSWORD,
    },
  }),
};
