const { InitUi } = require('#lib/InitUi');

class CreditsInitApi extends InitUi {
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
    store.registerModule('Credits', require('#features/credit/ui/stores/CreditsStore'));

    // DO NOT REMOVE: Generated stores will be added above this line
    /* eslint-enable */
  }

  /**
   * Initialize Vue routes for this feature.
   *
   * @return {Array}
   */
  initRoutes() {
    const routes = [];

    routes.push({
      path: '/credits',
      name: 'credits',
      component: () => import(/* webpackChunkName: "credit" */ '#features/credit/ui/pages/CreditsPage'),
    });

    // DO NOT REMOVE: Generated routes will be added above this line

    return routes;
  }
}

module.exports = CreditsInitApi;
