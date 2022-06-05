<template>
  <Dialog
    :visible="visible"
    :style="{ width: '50vw', 'max-width': '500px' }"
    :breakpoints="{'640px': '100vw'}"
    :closable="false"
    :header="renameDialogHeader"
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
      </div>

      <div class="dialog-buttons">
        <loading-spinner
          v-if="formSubmitting"
          :size-class="'fa-2x'"
        />

        <button
          :disabled="formSubmitting"
          @click.prevent="closeDialog"
        >
          Cancel
        </button>

        <button
          class="btn-primary"
          :disabled="submitDisabled"
        >
          {{ renameDialogAction }}
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
import { getLanguageString } from '#lib/Config';
import { getErrorMessage } from '#lib/Errors';
import { successToast, errorToast } from '#ui/lib/toast';
import { fieldErrorText } from '#ui/lib/forms';
import {
  TeamValidator,
  TEAM_VALIDATOR_FORM_FIELDS,
} from '#features/teams/lib/validators/TeamValidator';
import TextInput from '#ui/components/TextInput';
import LoadingSpinner from '#ui/components/LoadingSpinner';

// Setup

const instance = getCurrentInstance();
const store = useStore();
const form = {
  name: ref(''),
};
const renameDialogHeader = computed(() => getLanguageString('teams', 'renameDialogHeader'));
const renameDialogAction = computed(() => getLanguageString('teams', 'renameDialogAction'));

// Validation

const apiErrors = {
  name: ref([]),
};
const validator = new TeamValidator(TEAM_VALIDATOR_FORM_FIELDS);
const nameErrorText = computed(fieldErrorText('name', validator, form, apiErrors));
const resetApiErrors = () => {
  apiErrors.name.value = [];
};

// Open/close

const visible = ref(false);
const openDialog = (name) => {
  form.name.value = name;

  visible.value = true;
};
const closeDialog = () => {
  visible.value = false;
};
defineExpose({ openDialog, closeDialog });

// Rename team

const updateTeam = loadable(
  (values) => store.dispatch('Teams/updateTeam', values),
  'updateTeam',
  instance,
);
const getActiveUser = loadable(
  (values) => store.dispatch('ActiveUser/getActive', values),
  'activeUser',
  instance,
);

const submit = async () => {
  resetApiErrors();

  try {
    await updateTeam(deepUnref(form));

    // Force update to current user to refresh team data
    await getActiveUser({ force: true });

    successToast(getLanguageString('teams', 'renameDialogSuccess'));
    closeDialog();
  }
  catch (error) {
    errorToast(getErrorMessage(error, getLanguageString('teams', 'renameDialogError')));
  }
};

const formSubmitting = computed(
  () => instance.ctx.$isLoading('updateTeam') || instance.ctx.$isLoading('activeUser'),
);
const submitDisabled = computed(() => formSubmitting.value || ! validator.valid(form));
</script>
