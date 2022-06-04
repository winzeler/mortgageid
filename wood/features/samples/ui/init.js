const { InitUi } = require('#lib/InitUi');

class NodewoodSamplesInitUi extends InitUi {
  constructor() {
    super(__dirname);
  }

  /**
   * Initialize Vue routes for this feature.
   *
   * @return {Array}
   */
  initRoutes(router) {
    return [{
      path: '/',
      name: 'home',
      component: () => import(/* webpackChunkName: "samples" */ '#features/samples/ui/pages/HomePage'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import(/* webpackChunkName: "samples" */ '#features/samples/ui/pages/AboutPage'),
      meta: {
        routeName: 'About',
      },
    },
    {
      path: '/components',
      name: 'components',
      component: () => import(/* webpackChunkName: "samples" */ '#features/samples/ui/pages/ComponentsPage'),
      meta: {
        routeName: 'Components',
      },
    }];
  }
}

module.exports = NodewoodSamplesInitUi;
