const { compact } = require('lodash');
const { isFeatureEnabled } = require('#lib/Config');

/**
 * @type {Object} Common application config values.
 *
 * WARNING: Do not put any secure values in this file, as it is included in UI!
 */
module.exports = {
  /**
   * @type {Array<String>} Fields displayed in user list.
   */
  userListFields: compact([
    'name',
    'email',
    isFeatureEnabled('teams') ? 'team' : false,
    isFeatureEnabled('teams') ? 'role' : false,
    (isFeatureEnabled('subscriptions') && ! isFeatureEnabled('teams')) ? 'subscription' : false,
    'emailConfirmed',
    'lastLoggedInAt',
  ]),

  /**
   * @type {Array<String>} Fields displayed in team list.
   */
  teamListFields: compact([
    'name',
    isFeatureEnabled('subscriptions') ? 'subscription' : false,
    'createdAt',
  ]),

  /**
   * @type {Boolean} If the dashboard should display demo data instead of live data.
   */
  displayDashboardDemoData: true,
};
