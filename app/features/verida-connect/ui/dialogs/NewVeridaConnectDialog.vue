<template>
  <Dialog
    :visible="visible"
    :style="{ width: '50vw', 'max-width': '500px' }"
    :breakpoints="{'640px': '100vw'}"
    :closable="false"
    header="New Verida Connect"
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
        :disabled="$isLoading('createVeridaConnect')"
      />
    </form>

    <div class="dialog-buttons">
      <loading-spinner
        v-if="$isLoading('createVeridaConnect')"
        :size-class="'fa-2x'"
      />

      <button
        :disabled="$isLoading('createVeridaConnect')"
        @click="closeDialog"
      >
        Cancel
      </button>

      <button
        class="btn-primary"
        :disabled="! formValid || $isLoading('createVeridaConnect')"
        @click="submit"
      >
        Create
      </button>
    </div>
  </Dialog>
</template>

<script setup>
import { computed, ref, getCurrentInstance } from 'vue';
import { useStore } from 'vuex';
import { deepUnref } from 'vue-deepunref';
import { loadable } from 'vue-is-loading';
import {
  VeridaConnectValidator,
  VERIDA_CONNECT_FORM_FIELDS,
} from '#features/verida-connect/lib/validators/VeridaConnectValidator';
import { getErrorMessage } from '#lib/Errors';
import { fieldErrorText, applyErrors } from '#ui/lib/forms';
import { successToast, errorToast } from '#ui/lib/toast';
import TextInput from '#ui/components/TextInput';
import LoadingSpinner from '#ui/components/LoadingSpinner';

// Setup

const store = useStore();
const form = {
  name: ref(''),
};

// Validation

const apiErrors = {
  name: ref([]),
};
const validator = new VeridaConnectValidator(VERIDA_CONNECT_FORM_FIELDS);
const nameErrorText = computed(fieldErrorText('name', validator, form, apiErrors));
const formValid = computed(() => validator.valid(form));
const resetApiErrors = () => {
  apiErrors.name.value = [];
};

// Open/close

const visible = ref(false);
const openDialog = () => {
  form.name.value = '';
  apiErrors.name.value = [];

  visible.value = true;
};
const closeDialog = () => {
  visible.value = false;
};
defineExpose({ openDialog, closeDialog });

// New VeridaConnect

const createVeridaConnect = loadable(
  (values) => store.dispatch('VeridaConnects/createVeridaConnect', values),
  'createVeridaConnect',
  getCurrentInstance(),
);
const submit = async () => {
  resetApiErrors();

  if (! validator.valid(form)) {
    applyErrors(apiErrors, validator.errors(form, apiErrors));
    return;
  }

  try {
    await createVeridaConnect(deepUnref(form));

    successToast('VeridaConnect saved.');
    closeDialog();
  }
  catch (error) {
    errorToast(getErrorMessage(error, 'Could not update VeridaConnect.'));
  }
};
</script>
