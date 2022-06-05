// import SSOLogin from "../../../ui/views/SSOLogin";

const { InitUi } = require('#lib/InitUi');

class VeridaConnectsInitApi extends InitUi {
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
    store.registerModule('VeridaConnects', require('#features/verida-connect/ui/stores/VeridaConnectsStore'));

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

    // routes.push({
    //   path: '/connect',
    //   name: 'Connect',
    //   component: SSOLogin,
    // });
    routes.push({
      path: '/verida-connects',
      name: 'verida-connects',
      // component: SSOLogin,
      component: () => import(/* webpackChunkName: "verida-connect" */ '#features/verida-connect/ui/pages/VeridaConnectsPage'),
    });

    // DO NOT REMOVE: Generated routes will be added above this line

    return routes;
  }
}

module.exports = VeridaConnectsInitApi;
