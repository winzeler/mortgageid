const { isFeatureEnabled } = require('#lib/Config');

/**
 * @type {Object} UI/Vue configuration values.
 *
 * WARNING: Do not put any secure values in this file, as it is included in UI!
 */
const uiConfig = {
  /**
   * @type {Array<Component>} Vue components that can act as the outer application template for
   * certain routes.
   */
  templateComponents: {},

  /**
   * @type {Object} Configuration options for toasts.
   */
  toast: {
    duration: 5000,
    position: 'bottom-left',
  },

  /**
   * @type {Array<Object>} Menu items that appear in the app sidebar.
   */
  appMenuEntries: [{
    name: 'Start',
    path: '/',
    icon: 'fa-arrow-right',
  }, {
    name: 'About',
    path: '/about',
    icon: 'fa-question-circle',
  }, // {
    // name: 'Components',
    // path: '/components',
    // icon: 'fa-columns',
  // }
  ],

  /**
   * @type {Array<Object>} Menu items that appear in the admin sidebar.
   */
  adminMenuEntries: [{
    name: 'Dashboard',
    path: '/admin',
    icon: 'fa-home',
  }],

  /**
   * @type {Array<Object>} Menu items that will apear in the user dropdown.
   */
  userMenuEntries: [{
    name: 'Profile',
    path: '/profile',
  }, {
    name: 'Support',
    path: '/support',
  }],
};

if (isFeatureEnabled('subscriptions')) {
  uiConfig.userMenuEntries.push({
    name: 'Subscription',
    path: '/subscription',
    permissions: ['manage_subscription'],
  });
}

if (isFeatureEnabled('teams')) {
  uiConfig.userMenuEntries.push({
    name: 'Team',
    path: '/team',
  });

  uiConfig.adminMenuEntries.push({
    name: 'Teams',
    path: '/admin/teams',
    icon: 'fa-users',
  });
}

uiConfig.adminMenuEntries.push({
  name: 'Users',
  path: '/admin/users',
  icon: 'fa-user',
});

module.exports = uiConfig;
