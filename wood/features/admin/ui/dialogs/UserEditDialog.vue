<template>
  <Dialog
    :visible="visible"
    :style="{ width: '50vw', 'max-width': '500px' }"
    :breakpoints="{'640px': '100vw'}"
    :closable="false"
    header="Edit User"
  >
    <form
      class="dialog-body"
      @submit.prevent="save"
    >
      <text-input
        v-model="form.name.value"
        class="mb-4"
        input-id="name"
        label="User Name"
        :error-text="nameErrorText.value"
        :disabled="$isLoading('saveUser')"
      />

      <div class="block mt-4">
        <div class="text-blue-500 text-xs">
          Account Type
        </div>
        <select
          v-model="form.account_type.value"
          aria-label="Account Type"
          class="mt-1 block"
          :disabled="$isLoading('saveUser')"
        >
          <option value="admin">
            Admin
          </option>
          <option value="user">
            User
          </option>
        </select>
      </div>
    </form>

    <div class="dialog-buttons">
      <loading-spinner
        v-if="$isLoading('saveUser')"
        :size-class="'fa-2x'"
      />

      <button
        :disabled="$isLoading('saveUser')"
        @click="closeDialog"
      >
        Cancel
      </button>

      <button
        class="btn-primary"
        :disabled="! formValid || $isLoading('saveUser')"
        @click="submit"
      >
        Save
      </button>
    </div>
  </Dialog>
</template>

<script setup>
import { computed, ref, getCurrentInstance } from 'vue';
import { useStore } from 'vuex';
import { deepUnref } from 'vue-deepunref';
import { loadable } from 'vue-is-loading';
import { getErrorMessage } from '#lib/Errors';
import { fieldErrorText, applyErrors } from '#ui/lib/forms';
import {
  UserValidator,
  ADMIN_USER_EDIT_FORM_FIELDS,
} from '#features/users/lib/validators/UserValidator';
import { successToast, errorToast } from '#ui/lib/toast';
import TextInput from '#ui/components/TextInput';
import LoadingSpinner from '#ui/components/LoadingSpinner';

// Setup

const store = useStore();
const id = ref(null);
const form = {
  name: ref(''),
  account_type: ref(''),
};

// Validation

const apiErrors = {
  name: ref([]),
  account_type: ref([]),
};
const validator = new UserValidator(ADMIN_USER_EDIT_FORM_FIELDS);
const nameErrorText = computed(fieldErrorText('name', validator, form, apiErrors));
const formValid = computed(() => validator.valid(form));
const resetApiErrors = () => {
  apiErrors.name.value = [];
  apiErrors.account_type.value = [];
};

// Open/close

const visible = ref(false);
const openDialog = (user) => {
  id.value = user.id;
  form.name.value = user.name;
  form.account_type.value = user.accountType;

  visible.value = true;
};
const closeDialog = () => {
  visible.value = false;
};
defineExpose({ openDialog, closeDialog });

// Save

const saveUser = loadable(
  (values) => store.dispatch('AdminUsers/saveUser', values),
  'saveUser',
  getCurrentInstance(),
);
const submit = async () => {
  resetApiErrors();

  if (! validator.valid(deepUnref(form))) {
    applyErrors(apiErrors, validator.errors(deepUnref(form), apiErrors));
    return;
  }

  try {
    await saveUser({ id: id.value, ...deepUnref(form) });
    successToast('User saved.');
    closeDialog();
  }
  catch (error) {
    errorToast(getErrorMessage(error, 'Could not update user.'));
  }
};
</script>
