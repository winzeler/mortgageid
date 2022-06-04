<template>
  <div>
    <div
      v-if="submitted"
      class="card"
    >
      <h2 class="card-header">
        Done!
      </h2>
      <div class="card-body">
        <p>Your password has been changed, and you have been logged out from all devices.</p>
        <p>To use your brand-new password, <router-link to="/login">log in</router-link> now.</p>
      </div>
    </div>

    <form
      v-else
      class="card"
      @submit.prevent="submit"
    >
      <h2 class="card-header">
        Change password
      </h2>

      <div class="card-body">
        <text-input
          v-model="form.password"
          type="password"
          class="mb-4"
          input-id="password"
          label="Password"
          :error-text="passwordErrorText"
          :disabled="$isLoading('changePassword')"
        />

        <text-input
          v-model="form.password_repeat"
          type="password"
          class="mb-4"
          input-id="password_repeat"
          label="Repeat password"
          :error-text="passwordRepeatErrorText"
          :disabled="$isLoading('changePassword')"
        />

        <div class="flex items-center justify-between flex-row-reverse">
          <button
            class="btn-primary"
            :disabled="! formValid || $isLoading('changePassword')"
          >
            Change Password
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
import TextInput from '#ui/components/TextInput';
import { fieldErrorText } from '#ui/lib/forms';
import {
  UserValidator,
  PASSWORD_CHANGE_FORM_FIELDS,
} from '#features/users/lib/validators/UserValidator';

const validator = new UserValidator(PASSWORD_CHANGE_FORM_FIELDS);

export default {
  name: 'ChangePassword',

  components: {
    TextInput,
  },

  data: () => ({
    form: {
      password: '',
      password_repeat: '',
    },

    apiErrors: {
      password: [],
      password_repeat: [],
    },

    submitted: false,
  }),

  computed: {
    passwordErrorText: fieldErrorText('password', validator),
    passwordRepeatErrorText: fieldErrorText('password_repeat', validator),

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
        'changePassword',
      ]),
    ),

    /**
     * Reset form errors arising from the API.
     */
    resetApiErrors() {
      this.apiErrors = {
        password: [],
        password_repeat: [],
      };
    },

    /**
     * Submit the change password form.
     */
    async submit() {
      this.resetApiErrors();

      if (! validator.valid(this.form)) {
        this.apiErrors = validator.errors(this.form, this.apiErrors);
        return;
      }

      await this.changePassword({
        token: this.$route.query.token,
        password: this.form.password,
        password_repeat: this.form.password_repeat,
      });
      this.submitted = true;
    },
  },
};
</script>

<style scoped>
</style>
