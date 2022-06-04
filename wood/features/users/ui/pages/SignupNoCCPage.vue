<template>
  <div class="w-1/3">
    <form
      class="card"
      @submit.prevent="submit"
    >
      <div class="card-body">
        <text-input
          v-model="form.email"
          class="mb-4"
          input-id="email"
          label="Email Address"
          :error-text="emailErrorText"
          :disabled="$isLoading('signup')"
        />

        <text-input
          v-model="form.name"
          class="mb-4"
          input-id="name"
          label="Name"
          :error-text="nameErrorText"
          :disabled="$isLoading('signup')"
        />

        <text-input
          v-model="form.password"
          type="password"
          class="mb-4"
          input-id="password"
          label="Password"
          :error-text="passwordErrorText"
          :disabled="$isLoading('signup')"
        />

        <text-input
          v-model="form.password_repeat"
          type="password"
          class="mb-4"
          input-id="password_repeat"
          label="Repeat password"
          :error-text="passwordRepeatErrorText"
          :disabled="$isLoading('signup')"
        />

        <div class="flex items-center justify-between flex-row">
          <div class="text-sm">
            Have an account?
            <router-link
              to="/login"
            >
              Login
            </router-link>
          </div>

          <button
            class="btn-primary"
            :disabled="! formValid || $isLoading('signup')"
          >
            Sign up
          </button>
        </div>
      </div>
    </form>

    <div class="text-sm mt-4 text-center">
      By creating an account, you agree to our
      <a
        class="whitespace-nowrap"
        @click="$refs.tosDialog.openDialog()"
      >
        Terms of Service
      </a>
      and
      <a
        class="whitespace-nowrap"
        @click="$refs.privacyPolicyDialog.openDialog()"
      >
        Privacy Policy
      </a>. We will occasionally send you emails about your account.
    </div>

    <tos-dialog ref="tosDialog" />
    <privacy-policy-dialog ref="privacyPolicyDialog" />
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
  SIGNUP_FORM_FIELDS,
} from '#features/users/lib/validators/UserValidator';
import TosDialog from '#features/users/ui/dialogs/TosDialog';
import PrivacyPolicyDialog from '#features/users/ui/dialogs/PrivacyPolicyDialog';

const validator = new UserValidator(SIGNUP_FORM_FIELDS);

export default {
  name: 'SignupNoCCPage',

  components: {
    TextInput,
    TosDialog,
    PrivacyPolicyDialog,
  },

  data: () => ({
    form: {
      email: '',
      name: '',
      password: '',
      password_repeat: '',
    },
    apiErrors: {
      email: [],
      name: [],
      password: [],
      password_repeat: [],
    },
  }),

  computed: {
    emailErrorText: fieldErrorText('email', validator),
    nameErrorText: fieldErrorText('name', validator),
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

  /**
   * Save any subscription plan ID in a localstorage item to use later on plan choice page.
   */
  mounted() {
    if (this.$route.query['plan-id']) {
      localStorage.setItem('signup-plan-id', this.$route.query['plan-id']);
    }
  },

  methods: {
    isEmpty,

    ...mapLoadableMethods(
      mapActions('ActiveUser', [
        'signup',
      ]),
    ),

    /**
     * Reset form errors arising from the API.
     */
    resetApiErrors() {
      this.apiErrors = {
        email: [],
        name: [],
        password: [],
        password_repeat: [],
      };
    },

    /**
     * Submit the signup form.
     */
    async submit() {
      this.resetApiErrors();

      if (! validator.valid(this.form)) {
        this.apiErrors = validator.errors(this.form, this.apiErrors);
        return;
      }

      await this.signup(this.form);
      this.$router.push('/onboarding-email-confirm');
    },
  },
};
</script>

<style scoped>
</style>
