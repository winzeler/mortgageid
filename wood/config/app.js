/**
 * @type {Object} Common application config values.
 *
 * WARNING: Do not put any secure values in this file, as it is included in UI!
 */
module.exports = {
  /**
   * @type {String} Common name for application.
   */
  name: 'Nodewood',

  /**
   * @type {String} The base URL for the application.
   */
  url: 'https://localhost/',

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
      'subscriptions',
      'teams',
    ],
  },

  /**
   * @type {String} Default error message to return, when none other provided.
   */
  defaultErrorMessage: 'An unexpected error has occurred.',

  /**
   * @type {Array} URLs that end in these file extensions will be ignored when logging.
   */
  logIgnoreExtensions: [
    'js',
    'js.map',
    'png',
    'jpg',
    'gif',
    'css',
    'html',
    'svg',
  ],

  /**
   * @type {String} The maximum request body size.
   */
  bodyLimit: '100kb',

  /**
   * @type {Number} The maximum number of parameters allowed in URL-encoded data.
   */
  urlParameterLimit: 1000,
};
