<template>
  <div class="flex justify-center">
    <div class="w-full sm:w-1/3">
      <form
        class="card"
        @submit.prevent="submit"
      >
        <h2 class="card-header">
          Profile
        </h2>

        <div class="card-body">
          <text-input
            v-model="form.name"
            class="mb-4"
            input-id="name"
            label="Name"
            :error-text="nameErrorText"
            :disabled="$isLoading('updateUser')"
          />

          <a
            v-if="! passwordVisible"
            @click="passwordVisible = true"
          >
            Change Password?
          </a>

          <div
            v-if="passwordVisible"
            class="mb-4 flex justify-between"
          >
            <div>Change Password:</div>
            <a @click="passwordVisible = false">Cancel</a>
          </div>

          <div
            class="h-0 opacity-0 invisible"
            :class="{ 'password-visible': passwordVisible }"
          >
            <text-input
              v-model="form.password"
              type="password"
              class="mb-4"
              input-id="password"
              label="Password"
              :error-text="passwordErrorText"
              :disabled="$isLoading('updateUser')"
            />

            <text-input
              v-model="form.password_repeat"
              type="password"
              class="mb-4"
              input-id="password_repeat"
              label="Repeat Password"
              :error-text="passwordRepeatErrorText"
              :disabled="$isLoading('updateUser')"
            />
          </div>

          <div class="flex items-center justify-between flex-row-reverse">
            <button
              class="btn-primary"
              :disabled="! formValid || $isLoading('updateUser') || isUndefined(user)"
            >
              Update
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { mapLoadableMethods } from 'vue-is-loading';
import get from 'lodash/get';
import without from 'lodash/without';
import isUndefined from 'lodash/isUndefined';
import isEmpty from 'validator/es/lib/isEmpty';
import TextInput from '#ui/components/TextInput';
import { fieldErrorText } from '#ui/lib/forms';
import { successToast } from '#ui/lib/toast';
import {
  UserValidator,
  USER_UPDATE_FORM_FIELDS,
} from '#features/users/lib/validators/UserValidator';

// Use to validate when the user is changing their password
const passwordValidator = new UserValidator(USER_UPDATE_FORM_FIELDS);

// Use to validate when the user is not changing their password
const noPasswordValidator = new UserValidator(without(
  USER_UPDATE_FORM_FIELDS,
  'password',
  'password_repeat',
));

export default {
  name: 'ProfilePage',

  components: {
    TextInput,
  },

  /**
   * If active user is loaded, pre-fill their data in the form.
   */
  data() {
    return {
      form: {
        name: get(this.$store.state.ActiveUser.user, 'name', ''),
        password: '',
        password_repeat: '',
      },
      apiErrors: {
        name: [],
        password: [],
        password_repeat: [],
      },

      passwordVisible: false,
    };
  },

  computed: {
    ...mapState('ActiveUser', [
      'user',
    ]),

    nameErrorText: fieldErrorText('name', passwordValidator),
    passwordErrorText: fieldErrorText('password', passwordValidator),
    passwordRepeatErrorText: fieldErrorText('password_repeat', passwordValidator),

    /**
     * Form is valid if all inputs are full and valid.
     *
     * Use correct validator based on if password fields are visible.
     *
     * @return {Boolean}
     */
    formValid() {
      return this.passwordVisible
        ? passwordValidator.valid(this.form)
        : noPasswordValidator.valid(this.form);
    },
  },

  watch: {
    /**
     * When active user changes (i.e. has finished loading), update form values.
     *
     * @param {UserModel} newUser - The new active user.
     */
    user(newUser) {
      this.form.name = newUser.name;
    },
  },

  methods: {
    isEmpty,
    isUndefined,

    ...mapLoadableMethods(
      mapActions('ActiveUser', [
        'updateUser',
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
     * Submit the update form.
     */
    async submit() {
      this.resetApiErrors();

      const validator = this.passwordVisible
        ? passwordValidator
        : noPasswordValidator;

      if (! validator.valid(this.form)) {
        this.apiErrors = validator.errors(this.form, this.apiErrors);
        return;
      }

      await this.updateUser(this.form);
      successToast('Account updated.');

      this.form.password = '';
      this.form.password_repeat = '';
      this.passwordVisible = false;
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
