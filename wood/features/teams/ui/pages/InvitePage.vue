<template>
  <div>
    <loading-spinner v-if="$isLoading('getInvite')" />

    <div v-else>
      <h2 class="text-center mb-4">
        {{ invitePageHeader }}
      </h2>

      <form
        class="card"
        @submit.prevent="submit"
      >
        <div class="card-body">
          <text-input
            v-if="! userExists"
            v-model="form.name"
            class="mb-4"
            input-id="name"
            label="Name"
            :error-text="nameErrorText"
            :disabled="$isLoading('acceptInvite')"
          />

          <text-input
            v-model="form.password"
            type="password"
            class="mb-4"
            input-id="password"
            label="Password"
            :error-text="passwordErrorText"
            :disabled="$isLoading('acceptInvite')"
          />

          <text-input
            v-if="! userExists"
            v-model="form.password_repeat"
            type="password"
            class="mb-4"
            input-id="password_repeat"
            label="Repeat password"
            :error-text="passwordRepeatErrorText"
            :disabled="$isLoading('acceptInvite')"
          />

          <div
            v-if="userExists"
            class="mb-4"
          >
            Please enter your password for
            <strong>{{ invite.email }}</strong>
            to log in and accept this invite.
          </div>

          <div class="flex items-center justify-between flex-row-reverse">
            <button
              class="btn-primary"
              :disabled="! formValid || $isLoading('acceptInvite')"
            >
              Accept Invite
            </button>
          </div>
        </div>
      </form>

      <div
        v-if="! userExists"
        class="text-sm mt-4 text-center"
      >
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
        </a>.
        <br>We will occasionally send you emails about your account.
      </div>
    </div>

    <tos-dialog ref="tosDialog" />
    <privacy-policy-dialog ref="privacyPolicyDialog" />
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import { mapLoadableMethods } from 'vue-is-loading';
import isEmpty from 'validator/es/lib/isEmpty';
import TextInput from '#ui/components/TextInput';
import { fieldErrorText } from '#ui/lib/forms';
import {
  UserValidator,
  ACCEPT_INVITE_NEW_USER_FIELDS,
  ACCEPT_INVITE_EXISTING_USER_FIELDS,
} from '#features/users/lib/validators/UserValidator';
import TosDialog from '#features/users/ui/dialogs/TosDialog';
import PrivacyPolicyDialog from '#features/users/ui/dialogs/PrivacyPolicyDialog';
import LoadingSpinner from '#ui/components/LoadingSpinner';
import { getConfig, getLanguageString } from '#lib/Config';

const newUserValidator = new UserValidator(ACCEPT_INVITE_NEW_USER_FIELDS);
const existingUserValidator = new UserValidator(ACCEPT_INVITE_EXISTING_USER_FIELDS);

export default {
  name: 'InvitePage',

  components: {
    TextInput,
    TosDialog,
    PrivacyPolicyDialog,
    LoadingSpinner,
  },

  data: () => ({
    form: {
      name: '',
      password: '',
      password_repeat: '',
    },
    apiErrors: {
      name: [],
      password: [],
      password_repeat: [],
    },
  }),

  computed: {
    ...mapState('AcceptInvite', [
      'invite',
      'teamName',
      'userExists',
    ]),

    nameErrorText: fieldErrorText('name', newUserValidator),
    passwordErrorText: fieldErrorText('password', newUserValidator),
    passwordRepeatErrorText: fieldErrorText('password_repeat', newUserValidator),

    invitePageHeader() {
      return getLanguageString('teams', 'invitePageHeader', {
        teamName: this.teamName,
        appName: getConfig('app', 'name'),
      });
    },

    /**
     * Form is valid if all inputs are full and valid.
     *
     * @return {Boolean}
     */
    formValid() {
      return this.userExists
        ? existingUserValidator.valid(this.form)
        : newUserValidator.valid(this.form);
    },
  },

  /**
   * Save any subscription plan ID in a localstorage item to use later on plan choice page.
   */
  async mounted() {
    await this.getInvite({ token: this.$route.query.token });
    this.form.name = this.invite.name;
  },

  methods: {
    isEmpty,

    ...mapLoadableMethods(
      mapActions('AcceptInvite', [
        'getInvite',
        'acceptInvite',
      ]),
    ),

    /**
     * Reset form errors arising from the API.
     */
    resetApiErrors() {
      this.apiErrors = {
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

      const validator = this.userExists ? existingUserValidator : newUserValidator;

      if (! validator.valid(this.form)) {
        this.apiErrors = validator.errors(this.form, this.apiErrors);
        return;
      }

      await this.acceptInvite({
        token: this.$route.query.token,
        ...this.form,
      });

      this.$router.push(this.userExists ? '/' : '/onboarding-email-confirm');
    },
  },
};
</script>

<style scoped>
</style>
