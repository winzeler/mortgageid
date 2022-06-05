<template>
  <Dialog
    :visible="visible"
    :style="{ width: '50vw', 'max-width': '500px' }"
    :breakpoints="{'640px': '100vw'}"
    :closable="false"
    :header="inviteDialogHeader"
  >
    <form @submit.prevent="submit">
      <div class="dialog-body">
        <text-input
          v-model="form.name.value"
          class="mb-3"
          input-id="name"
          label="Name"
          :error-text="nameErrorText"
        />

        <text-input
          v-model="form.email.value"
          class="mb-3"
          input-id="email"
          label="Email"
          :error-text="emailErrorText"
        />

        <role-picker v-model="form.role.value" />
      </div>

      <div class="dialog-buttons">
        <loading-spinner
          v-if="$isLoading('inviteMember')"
          :size-class="'fa-2x'"
        />

        <button
          :disabled="$isLoading('inviteMember')"
          @click.prevent="closeDialog"
        >
          Cancel
        </button>

        <button
          class="btn-primary"
          :disabled="submitDisabled"
        >
          Invite
        </button>
      </div>
    </form>
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
  TeamMemberValidator,
  TEAM_MEMBER_VALIDATOR_FORM_FIELDS,
} from '#features/teams/lib/validators/TeamMemberValidator';
import { getLanguageString } from '#lib/Config';
import { successToast, errorToast } from '#ui/lib/toast';
import TextInput from '#ui/components/TextInput';
import LoadingSpinner from '#ui/components/LoadingSpinner';
import RolePicker from '#features/teams/ui/components/RolePicker';

// Setup

const instance = getCurrentInstance();
const store = useStore();
const form = {
  name: ref(''),
  email: ref(''),
  role: ref(''),
};
const inviteDialogHeader = getLanguageString('teams', 'inviteDialogHeader');

// Validation

const apiErrors = {
  name: ref([]),
  email: ref([]),
  role: ref([]),
};
const validator = new TeamMemberValidator(TEAM_MEMBER_VALIDATOR_FORM_FIELDS);
const nameErrorText = computed(fieldErrorText('name', validator, form, apiErrors));
const emailErrorText = computed(fieldErrorText('email', validator, form, apiErrors));
const formValid = computed(() => validator.valid(form));
const resetApiErrors = () => {
  apiErrors.name.value = [];
  apiErrors.email.value = [];
  apiErrors.role.value = [];
};

// Open/close

const visible = ref(false);
const openDialog = () => {
  form.name.value = '';
  form.email.value = '';
  form.role.value = '';

  apiErrors.name.value = '';
  apiErrors.email.value = '';
  apiErrors.role.value = '';

  visible.value = true;
};
const closeDialog = () => {
  visible.value = false;
};
defineExpose({ openDialog, closeDialog });

// Invite member

const inviteMember = loadable(
  (values) => store.dispatch('TeamMembers/inviteMember', values),
  'inviteMember',
  instance,
);
const submit = async () => {
  try {
    resetApiErrors();

    if (! validator.valid(deepUnref(form))) {
      applyErrors(apiErrors, validator.errors(deepUnref(form), apiErrors));
      return;
    }

    await inviteMember(deepUnref(form));

    successToast(getLanguageString('teams', 'inviteDialogSuccess'));
    closeDialog();
  }
  catch (error) {
    errorToast(getErrorMessage(error, getLanguageString('teams', 'inviteDialogError')));
  }
};

const submitDisabled = computed(
  () => instance.ctx.$isLoading('inviteMember')
  || form.role.value === ''
  || ! formValid.value,
);
</script>
