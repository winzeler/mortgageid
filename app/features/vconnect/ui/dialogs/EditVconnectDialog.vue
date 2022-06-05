<template>
  <Dialog
    :visible="visible"
    :style="{ width: '50vw', 'max-width': '500px' }"
    :breakpoints="{'640px': '100vw'}"
    :closable="false"
    :header="`Edit '${form.name.value}'`"
  >
    <form
      class="dialog-body"
      @submit.prevent="submit"
    >
      <text-input
        v-model="form.name.value"
        class="mb-4"
        input-id="name"
        label="Name"
        :error-text="nameErrorText"
        :disabled="$isLoading('updateVconnect')"
      />
    </form>

    <div class="dialog-buttons">
      <loading-spinner
        v-if="$isLoading('updateVconnect')"
        :size-class="'fa-2x'"
      />

      <button
        :disabled="$isLoading('updateVconnect')"
        @click="closeDialog"
      >
        Cancel
      </button>

      <button
        class="btn-primary"
        :disabled="! formValid || $isLoading('updateVconnect')"
        @click="submit"
      >
        Edit
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
import { successToast, errorToast } from '#ui/lib/toast';
import TextInput from '#ui/components/TextInput';
import LoadingSpinner from '#ui/components/LoadingSpinner';
import {
  VconnectValidator,
  VCONNECT_FORM_FIELDS,
} from '#features/vconnect/lib/validators/VconnectValidator';

// Setup

const store = useStore();
const id = ref(0);
const form = {
  name: ref(''),
};

// Validation

const apiErrors = {
  name: ref([]),
};
const validator = new VconnectValidator(VCONNECT_FORM_FIELDS);
const nameErrorText = computed(fieldErrorText('name', validator, form, apiErrors));
const formValid = computed(() => validator.valid(form));
const resetApiErrors = () => {
  apiErrors.name.value = [];
};

// Open/close

const visible = ref(false);
const openDialog = (vconnect) => {
  id.value = vconnect.id;
  form.name.value = vconnect.name;

  visible.value = true;
};
const closeDialog = () => {
  form.name.value = '';
  apiErrors.name.value = [];
  visible.value = false;
};
defineExpose({ openDialog, closeDialog });

// Edit Vconnect

const updateVconnect = loadable(
  (values) => store.dispatch('Vconnects/updateVconnect', values),
  'updateVconnect',
  getCurrentInstance(),
);
const submit = async () => {
  resetApiErrors();

  if (! validator.valid(deepUnref(form))) {
    applyErrors(apiErrors, validator.errors(deepUnref(form), apiErrors));
    return;
  }

  try {
    await updateVconnect({ id: id.value, ...deepUnref(form) });
    closeDialog();
    successToast('Vconnect updated.');
  }
  catch (error) {
    errorToast(getErrorMessage(error, 'Could not update Verida wallet.'));
  }
};
</script>
