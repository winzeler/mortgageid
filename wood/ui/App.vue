<template>
  <div class="w-full h-full outer-app">
    <Toast
      :position="toastPosition"
      group="default"
    />

    <template v-if="firstRouteLoaded">
      <component :is="routeTemplate" />
    </template>
  </div>
</template>

<script>
import get from 'lodash/get';
import clone from 'lodash/clone';

import { mapState, mapActions } from 'vuex';
import MinimalTemplate from '#ui/templates/MinimalTemplate/MinimalTemplate';
import AdminTemplate from '#ui/templates/AdminTemplate/AdminTemplate';
import AppTemplate from '#ui/templates/AppTemplate/AppTemplate';
import { getConfig } from '#lib/Config';
import { toast as toastConfig } from '#config/ui';
import { errorToast, clearToastGroup } from '#ui/lib/toast';

export default {
  name: 'App',

  components: {
    MinimalTemplate,
    AdminTemplate,
    AppTemplate,
    ...getConfig('ui', 'templateComponents'),
  },

  data: () => ({
    /**
     * Wait until after the router has routed at least once before we display route template.
     * Otherwise, we'll briefly flash AppTemplate until the route is parsed and we determine that
     * another template is set.
     */
    firstRouteLoaded: false,
  }),

  computed: {
    routeTemplate() {
      return this.$route.meta.routeTemplate || 'AppTemplate';
    },

    ...mapState('ActiveUser', [
      'user',
    ]),

    toastPosition() {
      return toastConfig.position;
    },
  },

  watch: {
    async $route(to, from) {
      document.title = getConfig('app', 'name');
      this.firstRouteLoaded = true;
    },
  },

  /**
   * Global component error handler.  If the error comes from a component that has an apiErrors
   * object, it attempts to set the apiErrors from any validation response.  Otherwise, it just
   * logs the error to the console.
   *
   * @param {Error} error - The error that was captured.
   * @param {Object} vm - The Vue component that triggered the error.
   */
  errorCaptured(error, vm) {
    return this.parseError(error, vm);
  },

  methods: {
    ...mapActions('ActiveUser', [
      'getActive',
    ]),

    /**
     * Gets API error messages from an error.  Attempts to retrieve error message from response,
     * but if the error comes from some other source (coding error, etc), it will log the error and
     * return the provided apiErrors unchanged.
     *
     * @param {Error} error - The error to get the message from.
     * @param {Object} apiErrors - The existing apiErrors.
     *
     * @return {Object}
     */
    getApiErrors(error, apiErrors) {
      const errors = clone(apiErrors);

      if (get(error, 'response.body.errors', false)) {
        get(error, 'response.body.errors', []).forEach((apiError) => {
          // If no source parameter provided, display error as a toast
          if (get(apiError, 'source.parameter', 'toast') === 'toast') {
            errorToast(apiError.title);
          }
          // Otherwise, add it to the error array for the specified paramter
          else {
            errors[apiError.source.parameter].push(apiError);
          }
        });
      }
      // Fail-safe error message
      else {
        console.error(error); // eslint-disable-line no-console
        errorToast(getConfig('app', 'defaultErrorMessage'));
      }

      return errors;
    },

    /**
     * Parse a captured error.
     *
     * @param {Error} error - The error that was captured.
     * @param {Object} vm - The Vue component that triggered the error.
     */
    parseError(error, vm) {
      if (error.status === 401) {
        // Clear all default toasts, can be a whole collection of errors if a bunch of API requests
        // happened all at once
        clearToastGroup('default');

        const errorText = get(error, 'response.body.errors.0.title', 'Unauthorized, please log in.');
        errorToast(errorText);
      }
      // Error provided from our API
      else if (get(vm, 'apiErrors', false)) {
        vm.apiErrors = this.getApiErrors(error, vm.apiErrors);
      }
      // Misc error
      else {
        console.error(error); // eslint-disable-line no-console
        errorToast(getConfig('app', 'defaultErrorMessage'));
      }

      return false;
    },
  },
};
</script>

<style scoped>
</style>
