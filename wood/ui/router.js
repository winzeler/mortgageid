/* eslint-disable */
import { createRouter, createWebHistory } from 'vue-router';
import store from '#ui/store';
import { errorToast } from '#ui/lib/toast';

const ACCOUNT_TYPE_ADMIN = 'admin';

const router = createRouter({ history: createWebHistory(process.env.BASE_URL), routes: [] });

/**
 * Ensure the active user is loaded into the store.
 */
async function ensureActiveUserLoaded() {
  if (! store.state.ActiveUser.user) {
    await store.dispatch('ActiveUser/getActive', { force: true }, { root: true });
  }
}

/**
 * If we should restrict access to a route because it is an admin route and the user is not an
 * admin user.
 *
 * @param {Object} route - The route to examine.
 *
 * @return {Boolean} True if we should restrict (deny) access.
 */
function shouldRestrictAdminAccess(route) {
  return route.meta.admin && store.state.ActiveUser.user.accountType !== ACCOUNT_TYPE_ADMIN;
}

/**
 * If we should restrict access to a route because it requires subscription capabilities that the
 * user's subscription does not provide.
 *
 * @param {Object} route - The route to examine.
 *
 * @return {Boolean} True if we should restrict (deny) access.
 */
function shouldRestrictSubscriptionAccess(route) {
  if (route.meta.capabilities) {
    if (store.state.ActiveUser.subscription) {
      return ! store.state.ActiveUser.subscription.hasCapabilities(route.meta.capabilities);
    }

    return true;
  }

  return false;
}

/**
 * If we should restrict access to a route because it requires role permissions that the user's
 * role does not provide
 *
 * @param {Object} route - The route to examine.
 *
 * @return {Boolean} True if we should restrict (deny) access.
 */
function shouldRestrictRoleAccess(route) {
  if (route.meta.permissions) {
    return ! store.state.ActiveUser.role.hasPermissions(route.meta.permissions);
  }

  return false;
}

/**
 * Create a Vue router.
 *
 * @param {Array} routes - The routes for the router.
 *
 * @return {VueRouter}
 */
function createNodewoodRouter(routes) {
  routes.forEach((route) => {
    router.addRoute(route);
  });

  router.beforeEach(async (to, from, next) => {
    // Don't perform permission checking on public routes
    if (to.meta.public) {
      next();
    }
    // Private routes have to load and check permissions for user
    else {
      await ensureActiveUserLoaded();

      if (shouldRestrictAdminAccess(to)) {
        next('/');
      }
      else if (shouldRestrictSubscriptionAccess(to)) {
        const errorMessage = store.state.ActiveUser.subscription
          ? `Your current subscription does not provide access to ${to.path}.`
          : `You require a subscription for access to ${to.path}.`;
        errorToast(errorMessage);

        next('/subscription');
      }
      else if (shouldRestrictRoleAccess(to)) {
        const errorMessage = `Your role in your team does not provide access to ${to.path}.`;
        errorToast(errorMessage);

        next('/');
      }
      else {
        next();
      }
    }
  });

  return router;
}

export {
  router,
  createNodewoodRouter,
};
