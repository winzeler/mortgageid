<template>
  <div class="card m-4 text-center sm:w-1/3 sm:m-0">
    <h2 class="card-header">
      Almost there!
    </h2>
    <div class="card-body">
      <div>
        Check your email for a link to confirm
        <br>
        your email address.
      </div>
      <hr class="my-4">
      <div
        v-if="$isLoading('sendConfirmEmail')"
        class="text-xs"
      >
        Sending...
      </div>
      <div
        v-else
        class="text-xs"
      >
        Don't see it?  Make sure to check your spam folder, but if you still can't find it, then
        <a @click="sendConfirmEmail">click here</a>
        to be sent another confirmation email.
      </div>
    </div>
  </div>
</template>

<script>
import { mapLoadableMethods } from 'vue-is-loading';
import { mapActions } from 'vuex';

export default {
  name: 'OnboardingEmailConfirm',

  methods: {
    ...mapLoadableMethods(
      mapActions('ActiveUser', [
        'sendConfirmEmail',
      ]),
    ),
  },
};
</script>

<style scoped>
</style>
