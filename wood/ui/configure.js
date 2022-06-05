import flatten from 'lodash/flatten';
import uniqBy from 'lodash/uniqBy';
import reverse from 'lodash/reverse';

import vClickOutside from 'click-outside-vue3';
import IsLoading from 'vue-is-loading';

// Automatically import & register all Chartjs controllers, scales, etc
import Chart from 'chart.js/auto'; // eslint-disable-line no-unused-vars

import PrimeVue from 'primevue/config';
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast';
import ToastService from 'primevue/toastservice';
import 'primevue/resources/primevue.min.css';
import 'primevue/resources/themes/saga-blue/theme.css';
import 'primeicons/primeicons.css';

import { allFeatures } from '#lib/Config';
import { createNodewoodRouter } from '#ui/router';
import store from '#ui/store';

import '#ui/assets/styles/tailwind.css';

export function setupPlugins(app) {
  app.use(vClickOutside);
  app.use(IsLoading);
  app.use(PrimeVue);
  app.use(ToastService);
  app.component('Dialog', Dialog);
  app.component('Toast', Toast);
}

export function setupFeatures(app) {
  const routes = initFeatures(getInitializers());

  routes.push({
    path: '/:notFound(.*)',
    name: '404',
    component: () => import(/* webpackMode: "eager" */ '#ui/pages/Error404Page'),
    meta: {
      routeTemplate: 'MinimalTemplate',
      public: true,
    },
  });

  app.use(createNodewoodRouter(routes));
  app.use(store);
}

/**
 * Get all the feature initializers.
 *
 * @return Array
 */
function getInitializers() {
  return allFeatures().map((name) => {
    try {
      return require(`@app/features/${name}/ui/init`); // eslint-disable-line
    }
    catch (error) {
      return require(`@wood/features/${name}/ui/init`); // eslint-disable-line
    }
  });
}

/**
 * Initializes Vue modules (Vuex store, routes, watchers).
 *
 * @param {Array} initializers - The initializers. (Stores & routes overwrite.)
 *
 * @return {Array} The routes for the app.
 */
function initFeatures(initializers) {
  // Init app stores & routes first
  const initializedRoutes = initializers.map((Init) => {
    const instance = new Init();
    instance.initStores(store);

    const innerRoutes = instance.initRoutes();

    return innerRoutes;
  });

  // Init watchers after all stores are initialized
  initializers.forEach((Init) => {
    const instance = new Init();
    return instance.initWatchers(store);
  });

  // Routes start as an array of arrays in feature order.
  // Start by reversing the feature order, then flatten and remove duplicates (by path).
  // This ensures that routes from later-included features "overwrite" ones from earlier features,
  // while maintaining the order of routes within those features.
  return uniqBy(flatten(reverse(initializedRoutes)), 'path');
}
