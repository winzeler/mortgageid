class InitUi {
  /**
   * Initialize Vuex store modules for this feature.
   *
   * @param {Vuex} store - Vuex store to intialize store modules.
   */
  initStores(store) {
    // Defined in subclass
  }

  /**
   * Initialize watchers on Vuex stores for this feature.  Must be called after all stores are
   * initialized, so "loaded store order" doesn't interfere with which feature can watch which
   * store.
   *
   * @param {Vuex} store - Vuex store to intialize store modules.
   */
  initWatchers(store) {
    // Defined in subclass
  }

  /**
   * Initialize Vue routes for this feature.
   *
   * @return {Array}
   */
  initRoutes() {
    // Defined in subclass
  }
}

module.exports = {
  InitUi,
};
