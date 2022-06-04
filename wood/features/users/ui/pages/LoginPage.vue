<template>
  <div class="w-full m-4 sm:w-1/3 sm:m-auto">
    <form
      class="card"
      @submit.prevent="submit"
    >
      <h2 class="card-header">
        Log in
      </h2>

      <div class="card-body">
        <text-input
          v-model="form.email.value"
          class="mb-4"
          input-id="email"
          label="Email Address"
          :error-text="emailErrorText"
          :disabled="$isLoading('login')"
        />

        <text-input
          v-model="form.password.value"
          type="password"
          class="mb-4"
          input-id="password"
          label="Password"
          :error-text="passwordErrorText"
          :disabled="$isLoading('login')"
        />

        <div class="flex items-center justify-between flex-row-reverse">
          <button
            class="btn-primary"
            :disabled="! formValid || $isLoading('login')"
          >
            Log in
          </button>
        </div>

        <div class="flex flex-col items-center mt-4 text-sm">
          <router-link
            to="/reset-password"
            class="mb-2"
          >
            Forgot your password?
          </router-link>
          <router-link to="/signup">
            Or create an account?
          </router-link>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, ref, getCurrentInstance } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { deepUnref } from 'vue-deepunref';
import { loadable } from 'vue-is-loading';
import { getErrorMessage } from '#lib/Errors';
import TextInput from '#ui/components/TextInput';
import { fieldErrorText, applyErrors } from '#ui/lib/forms';
import { errorToast } from '#ui/lib/toast';
import {
  UserValidator,
  LOGIN_FORM_FIELDS,
} from '#features/users/lib/validators/UserValidator';

// Setup

const store = useStore();
const form = {
  email: ref(''),
  password: ref(''),
};

// Validation

const apiErrors = {
  email: ref([]),
  password: ref([]),
};
const validator = new UserValidator(LOGIN_FORM_FIELDS);
const emailErrorText = computed(fieldErrorText('email', validator, form, apiErrors));
const passwordErrorText = computed(fieldErrorText('password', validator, form, apiErrors));
const formValid = computed(() => validator.valid(form));
const resetApiErrors = () => {
  apiErrors.email.value = [];
  apiErrors.password.value = [];
};

// Login

const router = useRouter();
const login = loadable(
  (values) => store.dispatch('ActiveUser/login', values),
  'login',
  getCurrentInstance(),
);
const submit = async () => {
  try {
    resetApiErrors();

    if (! validator.valid(deepUnref(form))) {
      applyErrors(apiErrors, validator.errors(deepUnref(form), apiErrors));
      return;
    }

    await login(deepUnref(form));
    router.push('/');
  }
  catch (error) {
    errorToast(getErrorMessage(error, 'Could not log in at this time.'));
  }
};
</script>
