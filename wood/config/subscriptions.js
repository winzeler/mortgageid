/**
 * @type {Object} Subscription config values.
 */
module.exports = {
  /**
   * @type {Boolean} If the final invoice of a cancelled subscription should be prorated.
   */
  prorateOnCancel: true,

  /**
   * @type {Number} The number of trial period days before the customer is charged.  For no trial
   *                period, set to 'null'.
   */
  trialDays: null,

  /**
   * @type {String} The default currency to set for users.
   */
  defaultCurrency: 'usd',
};
