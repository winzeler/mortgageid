<template>
  <div class="w-full m-4 sm:w-1/3 sm:m-auto">
    <div
      v-if="submitted"
      class="card"
    >
      <h2 class="card-header">
        Great!
      </h2>
      <div class="card-body">
        <p>We sent you an email with a link you can use to reset your password.</p>
        <p>If you haven't received it in a few minutes, make sure to check your spam folder.</p>
      </div>
    </div>

    <form
      v-else
      class="card"
      @submit.prevent="submit"
    >
      <h2 class="card-header">
        Reset password
      </h2>

      <div class="card-body">
        <p class="pb-4">
          To recover your password, enter your email address.
          You will be mailed a link that will allow you to change your password.
        </p>

        <text-input
          v-model="form.email"
          class="mb-4"
          input-id="email"
          label="Email Address"
          :error-text="emailErrorText"
          :disabled="$isLoading('resetPassword')"
        />

        <div class="flex items-center justify-between flex-row-reverse">
          <button
            class="btn-primary"
            :disabled="! formValid || $isLoading('resetPassword')"
          >
            Reset Password
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import { mapLoadableMethods } from 'vue-is-loading';
import isEmpty from 'validator/es/lib/isEmpty';
import {
  UserValidator,
  PASSWORD_RESET_FORM_FIELDS,
} from '#features/users/lib/validators/UserValidator';
import TextInput from '#ui/components/TextInput';
import { fieldErrorText } from '#ui/lib/forms';

const validator = new UserValidator(PASSWORD_RESET_FORM_FIELDS);

export default {
  name: 'GetResetToken',

  components: {
    TextInput,
  },

  data: () => ({
    form: {
      email: '',
    },
    apiErrors: {
      email: [],
    },

    submitted: false,
  }),

  computed: {
    emailErrorText: fieldErrorText('email', validator),

    /**
     * Form is valid if all inputs are full and valid.
     *
     * @return {Boolean}
     */
    formValid() {
      return validator.valid(this.form);
    },
  },

  methods: {
    isEmpty,

    ...mapLoadableMethods(
      mapActions('ActiveUser', [
        'resetPassword',
      ]),
    ),

    /**
     * Reset form errors arising from the API.
     */
    resetApiErrors() {
      this.apiErrors = {
        email: [],
      };
    },

    /**
     * Submit the reset password form.
     */
    async submit() {
      this.resetApiErrors();

      if (! validator.valid(this.form)) {
        this.apiErrors = validator.errors(this.form, this.apiErrors);
        return;
      }

      await this.resetPassword(this.form);
      this.submitted = true;
    },
  },
};
</script>

<style scoped>
</style>
