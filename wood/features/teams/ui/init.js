const { InitUi } = require('#lib/InitUi');

class NodewoodTeamsInitUi extends InitUi {
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
    store.registerModule('Teams', require('#features/teams/ui/stores/TeamsStore'));
    store.registerModule('TeamMembers', require('#features/teams/ui/stores/TeamMembersStore'));
    store.registerModule('AcceptInvite', require('#features/teams/ui/stores/AcceptInviteStore'));

    // DO NOT REMOVE: Generated stores will be added above this line
    /* eslint-enable */
  }

  /**
   * Initialize Vue routes for this feature.
   *
   * @param {VueRouter} router - Router to add routes to.
   */
  initRoutes() {
    const routes = [];

    // Replaces the users signup page
    routes.push({
      path: '/signup',
      name: 'signup',
      component: () => import(/* webpackChunkName: "teams" */ '#features/teams/ui/pages/SignupNoCCTeamPage'),
      meta: {
        routeTemplate: 'MinimalTemplate',
        public: true,
      },
    });

    routes.push({
      path: '/team',
      name: 'team',
      component: () => import(/* webpackChunkName: "teams" */ '#features/teams/ui/pages/TeamPage'),
    });

    routes.push({
      path: '/no_team',
      name: 'no_team',
      component: () => import(/* webpackMode: "eager" */ '#features/teams/ui/pages/NoTeamPage'),
      meta: {
        routeTemplate: 'MinimalTemplate',
        public: true,
      },
    });

    routes.push({
      path: '/accept-invite',
      name: 'accept_invite',
      component: () => import(/* webpackMode: "eager" */ '#features/teams/ui/pages/InvitePage'),
      meta: {
        routeTemplate: 'MinimalTemplate',
        public: true,
      },
    });

    return routes;
  }
}

module.exports = NodewoodTeamsInitUi;
