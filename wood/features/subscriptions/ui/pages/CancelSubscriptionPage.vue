<template>
  <div>
    <div class="card w-full sm:w-3/5 mx-auto">
      <h2 class="card-header">
        Is It Something We Said?
      </h2>
      <div class="card-body">
        <p>
          We hate to see you leave &mdash; is there anything we can do to keep you around?  Is there
          a feature missing, a problem you ran into, a color out of place?  If there's anything we
          can do so you'll give us another chance, please let us know:
        </p>

        <textarea
          v-model="message"
          aria-label="Enter support request text"
          class="block mt-6 mb-2 w-4/5 h-32 mx-auto border border-themeBackground-500 rounded"
          :disabled="$isLoading('sendSupportRequest')"
        />
      </div>
    </div>
    <div class="w-full sm:w-3/5 mx-auto mt-4 flex justify-end space-x-4">
      <router-link
        class="btn text-center no-underline hover:text-themeBackground-900"
        to="/subscription"
      >
        Take Me Back
      </router-link>
      <button
        class="btn-primary"
        :disabled="submitButtonDisabled"
        @click="submit"
      >
        Submit Support Request
      </button>
    </div>

    <div class="w-3/5 mx-auto mt-4 flex justify-end space-x-4">
      <a
        class="text-themeCritical-500 hover:text-themeBackground-900 mt-2"
        @click="$refs.cancelSubscriptionDialog.openDialog()"
      >
        I'm sure I want to cancel
      </a>
    </div>

    <cancel-subscription-dialog ref="cancelSubscriptionDialog" />
  </div>
</template>

<script>
import isEmpty from 'lodash/isEmpty';
import { mapActions } from 'vuex';
import { mapLoadableMethods } from 'vue-is-loading';
import CancelSubscriptionDialog from '#features/subscriptions/ui/dialogs/CancelSubscriptionDialog';
import { successToast } from '#ui/lib/toast';

export default {
  name: 'CancelSubscriptionPage',

  components: {
    CancelSubscriptionDialog,
  },

  data: () => ({
    message: '',
  }),

  computed: {
    /**
     * If the submit button should be disabled.
     *
     * @return {Boolean}
     */
    submitButtonDisabled() {
      return isEmpty(this.message) || this.$isLoading('sendSupportRequest');
    },
  },

  methods: {
    ...mapLoadableMethods(
      mapActions('ActiveUser', [
        'sendSupportRequest',
      ]),
    ),

    /**
     * Submit the support request, and go back to subscription page.
     */
    async submit() {
      await this.sendSupportRequest({ message: this.message });
      this.$router.push({ name: 'subscription' });
      successToast('Support request sent.  We\'ll get back to you ASAP!');
    },
  },
};
</script>

<style scoped>
</style>
