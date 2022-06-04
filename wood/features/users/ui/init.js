const { InitUi } = require('#lib/InitUi');
const { isFeatureEnabled } = require('#lib/Config');

class NodewoodUsersInitUi extends InitUi {
  constructor() {
    super(__dirname);
  }

  /**
   * Initialize Vuex store modules for this feature.
   *
   * @param {Vuex} store - Vuex store to intialize store modules.
   */
  initStores(store) {
    /* eslint-disable global-require */
    store.registerModule('ActiveUser', require('#features/users/ui/stores/ActiveUserStore'));
    /* eslint-enable */
  }

  /**
   * Initialize Vue routes for this feature.
   *
   * @return {Array}
   */
  initRoutes() {
    const routes = [];

    // Teams has a special signup page that collects team information
    if (! isFeatureEnabled('teams')) {
      routes.push({
        path: '/signup',
        name: 'signup',
        component: () => import(/* webpackChunkName: "users" */ '#features/users/ui/pages/SignupNoCCPage'),
        meta: {
          routeTemplate: 'MinimalTemplate',
          public: true,
        },
      });
    }

    routes.push({
      path: '/login',
      name: 'login',
      component: () => import(/* webpackChunkName: "users" */ '#features/users/ui/pages/LoginPage'),
      meta: {
        routeTemplate: 'MinimalTemplate',
        public: true,
      },
    });

    routes.push({
      path: '/reset-password',
      name: 'reset-password',
      component: () => import(/* webpackChunkName: "users" */ '#features/users/ui/pages/ResetPasswordPage'),
      meta: {
        routeTemplate: 'MinimalTemplate',
        public: true,
      },
    });

    routes.push({
      path: '/onboarding-email-confirm',
      name: 'onboarding-email-confirm',
      component: () => import(/* webpackChunkName: "users" */ '#features/users/ui/pages/OnboardingEmailConfirm'),
      meta: {
        routeTemplate: 'MinimalTemplate',
        public: true,
      },
    });

    routes.push({
      path: '/confirm-email',
      name: 'confirm-email',
      component: () => import(/* webpackChunkName: "users" */ '#features/users/ui/pages/ConfirmEmailPage'),
      meta: {
        routeTemplate: 'MinimalTemplate',
        public: true,
      },
    });

    routes.push({
      path: '/profile',
      name: 'profile',
      component: () => import(/* webpackChunkName: "users" */ '#features/users/ui/pages/ProfilePage'),
    });

    routes.push({
      path: '/support',
      name: 'support',
      component: () => import(/* webpackChunkName: "users" */ '#features/users/ui/pages/SupportPage'),
    });

    return routes;
  }
}

module.exports = NodewoodUsersInitUi;
