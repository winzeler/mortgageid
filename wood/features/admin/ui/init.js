const { InitUi } = require('#lib/InitUi');
const { getConfig, isFeatureEnabled } = require('#lib/Config');

class NodewoodAdminInitUi extends InitUi {
  constructor() {
    super(__dirname);

    if (! getConfig('app', 'features.wood').includes('users')) {
      throw new Error('Nodewood "admin" feature requires Nodewood "users" feature.');
    }
  }

  /**
   * Initialize Vuex store modules for this feature.
   *
   * @param {Vuex} store - Vuex store to intialize store modules.
   */
  initStores(store) {
    /* eslint-disable global-require */
    store.registerModule('AdminDashboard', require('#features/admin/ui/stores/AdminDashboardStore'));
    store.registerModule('AdminUsers', require('#features/admin/ui/stores/AdminUsersStore'));

    if (isFeatureEnabled('teams')) {
      store.registerModule('AdminTeams', require('#features/admin/ui/stores/AdminTeamsStore'));
    }
    /* eslint-enable */
  }

  /**
   * Initialize Vue routes for this feature.
   *
   * @param {VueRouter} router - Router to add routes to.
   */
  initRoutes(router) {
    const routes = [];

    routes.push({
      path: '/admin',
      name: 'adminDashboard',
      component: () => import(/* webpackChunkName: "admin" */ '#features/admin/ui/pages/DashboardPage'),
      meta: {
        routeTemplate: 'AdminTemplate',
        admin: true,
      },
    });

    routes.push({
      path: '/admin/users',
      name: 'adminUsers',
      component: () => import(/* webpackChunkName: "admin" */ '#features/admin/ui/pages/UserListPage'),
      meta: {
        routeTemplate: 'AdminTemplate',
        admin: true,
      },
    });

    if (isFeatureEnabled('teams')) {
      routes.push({
        path: '/admin/teams',
        name: 'adminTeams',
        component: () => import(/* webpackChunkName: "admin" */ '#features/admin/ui/pages/TeamListPage'),
        meta: {
          routeTemplate: 'AdminTemplate',
          admin: true,
        },
      });
    }

    return routes;
  }
}

module.exports = NodewoodAdminInitUi;
