const { InitUi } = require('#lib/InitUi');

class NodewoodSubscriptionsInitUi extends InitUi {
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
    store.registerModule('Subscriptions', require('#features/subscriptions/ui/stores/SubscriptionsStore'));

    // DO NOT REMOVE: Generated stores will be added above this line
    /* eslint-enable */
  }

  /**
   * Initialize watchers on Vuex stores for this feature.
   *
   * @param {Vuex} store - Vuex store to intialize store modules.
   */
  initWatchers(store) {
    store.watch(
      (state) => state.ActiveUser.user,
      (watched) => {
        store.commit('Subscriptions/initializeStripeConfig', { currency: watched.currency });
      },
    );
  }

  /**
   * Initialize Vue routes for this feature.
   *
   * @return {Array}
   */
  initRoutes(router) {
    return [{
      path: '/subscription',
      name: 'subscription',
      component: () => import(/* webpackChunkName: "subscriptions" */ '#features/subscriptions/ui/pages/SubscriptionPage'),
    },
    {
      path: '/subscription/cancel',
      name: 'cancel-subscription',
      component: () => import(/* webpackChunkName: "subscriptions" */ '#features/subscriptions/ui/pages/CancelSubscriptionPage'),
    },
    {
      path: '/subscription/change',
      name: 'change-subscription',
      component: () => import(/* webpackChunkName: "subscriptions" */ '#features/subscriptions/ui/pages/ChangeSubscriptionPage'),
    }];
  }
}

module.exports = NodewoodSubscriptionsInitUi;
