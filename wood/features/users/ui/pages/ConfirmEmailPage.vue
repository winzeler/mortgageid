<template>
  <div>
    <div
      v-if="confirmed"
      class="card"
    >
      <h2 class="card-header">
        Done!
      </h2>
      <div class="card-body">
        <p>Your email address has been confirmed.</p>
        <p>You may <router-link to="/login">log in</router-link> now.</p>
      </div>
    </div>

    <div v-else>
      <!-- eslint-disable vue/no-v-html -->
      <div
        v-if="errorText"
        class="card"
      >
        <div
          class="text-themeCritical-500 card-body"
          v-html="errorText"
        />
      </div>
      <!-- eslint-enable -->

      <div v-else>
        <loading-spinner class="mb-4" />

        <div>Confirming email...</div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import { getErrorMessage } from '#lib/Errors';
import LoadingSpinner from '#ui/components/LoadingSpinner';

export default {
  name: 'ConfirmEmailPage',

  components: {
    LoadingSpinner,
  },

  data: () => ({
    errorText: null,
    confirmed: false,
  }),

  async created() {
    try {
      await this.confirmEmail({
        token: this.$route.query.token,
      });
      this.confirmed = true;
    }
    catch (error) {
      this.errorText = getErrorMessage(error, 'Could not confirm email address.');
    }
  },

  methods: {
    ...mapActions('ActiveUser', [
      'confirmEmail',
    ]),
  },
};
</script>

<style scoped>
</style>
