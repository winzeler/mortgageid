<template>
  <Dialog
    :visible="visible"
    :style="{ width: '50vw', 'max-width': '500px' }"
    :breakpoints="{'640px': '100vw'}"
    :closable="false"
    header="Edit Team"
  >
    <form
      class="dialog-body"
      @submit.prevent="save"
    >
      <text-input
        v-model="form.name.value"
        class="mb-4"
        input-id="name"
        label="Team Name"
        :error-text="nameErrorText"
        :disabled="$isLoading('saveTeam')"
      />
    </form>

    <div class="dialog-buttons">
      <loading-spinner
        v-if="$isLoading('saveTeam')"
        :size-class="'fa-2x'"
      />

      <button
        :disabled="$isLoading('saveTeam')"
        @click="closeDialog"
      >
        Cancel
      </button>

      <button
        class="btn-primary"
        :disabled="! formValid || $isLoading('saveTeam')"
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
  TeamValidator,
  ADMIN_TEAM_EDIT_FORM_FIELDS,
} from '#features/teams/lib/validators/TeamValidator';
import { successToast, errorToast } from '#ui/lib/toast';
import TextInput from '#ui/components/TextInput';
import LoadingSpinner from '#ui/components/LoadingSpinner';

// Setup

const store = useStore();
const id = ref(null);
const form = {
  name: ref(''),
};

// Validation

const apiErrors = {
  name: ref([]),
};
const validator = new TeamValidator(ADMIN_TEAM_EDIT_FORM_FIELDS);
const nameErrorText = computed(fieldErrorText('name', validator, form, apiErrors));
const formValid = computed(() => validator.valid(form));
const resetApiErrors = () => {
  apiErrors.name.value = [];
};

// Open/close

const visible = ref(false);
const openDialog = (team) => {
  id.value = team.id;
  form.name.value = team.name;

  visible.value = true;
};
const closeDialog = () => {
  visible.value = false;
};
defineExpose({ openDialog, closeDialog });

// Save

const saveTeam = loadable(
  (values) => store.dispatch('AdminTeams/saveTeam', values),
  'saveTeam',
  getCurrentInstance(),
);
const submit = async () => {
  resetApiErrors();

  if (! validator.valid(form)) {
    applyErrors(apiErrors, validator.errors(form, apiErrors));
    return;
  }

  try {
    await saveTeam({ id: id.value, ...deepUnref(form) });

    successToast('Team saved.');
    closeDialog();
  }
  catch (error) {
    errorToast(getErrorMessage(error, 'Could not update team.'));
  }
};
</script>
