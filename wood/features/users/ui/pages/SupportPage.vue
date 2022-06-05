<template>
  <form
    class="card w-full sm:w-1/2 mx-auto"
    @submit.prevent="submit"
  >
    <h2 class="card-header">
      Get Support
    </h2>
    <div class="card-body">
      <label for="text-support-message">
        Please let us know, with as much detail as possible, how we can help you:
        <textarea
          id="text-support-message"
          v-model="message"
          class="block mt-6 mb-6 w-full h-32 border border-themeBackground-500 rounded"
          :disabled="$isLoading('sendSupportRequest')"
        />
      </label>

      <div class="flex items-center justify-between flex-row-reverse">
        <button
          class="btn-primary"
          :disabled="submitButtonDisabled"
        >
          Submit Support Request
        </button>
      </div>
    </div>
  </form>
</template>

<script>
import isEmpty from 'lodash/isEmpty';
import { mapActions } from 'vuex';
import { mapLoadableMethods } from 'vue-is-loading';
import { successToast } from '#ui/lib/toast';

export default {
  name: 'SupportPage',

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
     * Submit the support request, and go back to home page.
     */
    async submit() {
      await this.sendSupportRequest({ message: this.message });
      this.$router.push('/');
      successToast('Support request sent.  We\'ll get back to you ASAP!');
    },
  },
};
</script>

<style scoped>
.password-visible {
  @apply
    h-auto
    opacity-100 visible
    transition-all ease-out duration-500;
}
</style>
