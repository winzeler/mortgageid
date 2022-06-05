// import SSOLogin from "./dialogs/SSOLogin";

const { InitUi } = require('#lib/InitUi');

class VconnectsInitApi extends InitUi {
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
    store.registerModule('Vconnects', require('#features/vconnect/ui/stores/VconnectsStore'));

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
      path: '/vconnects',
      name: 'vconnects',
      component: () => import(/* webpackChunkName: "vconnect" */ '#features/vconnect/ui/pages/VconnectsPage'),
    });

    // DO NOT REMOVE: Generated routes will be added above this line

    return routes;
  }
}

module.exports = VconnectsInitApi;
