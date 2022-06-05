<template>
  <Dialog
    :visible="visible"
    :style="{ width: '50vw', 'max-width': '500px' }"
    :breakpoints="{'640px': '100vw'}"
    :closable="false"
    header="New Wallet"
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
        :disabled="$isLoading('createVconnect')"
      />
    </form>

    <div class="dialog-buttons">
      <loading-spinner
        v-if="$isLoading('createVconnect')"
        :size-class="'fa-2x'"
      />

      <button
        :disabled="$isLoading('createVconnect')"
        @click="closeDialog"
      >
        Cancel
      </button>

      <button
        class="btn-primary"
        :disabled="! formValid || $isLoading('createVconnect')"
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
  VconnectValidator,
  VCONNECT_FORM_FIELDS,
} from '#features/vconnect/lib/validators/VconnectValidator';
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
const validator = new VconnectValidator(VCONNECT_FORM_FIELDS);
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

// New Vconnect

const createVconnect = loadable(
  (values) => store.dispatch('Vconnects/createVconnect', values),
  'createVconnect',
  getCurrentInstance(),
);
const submit = async () => {
  resetApiErrors();

  if (! validator.valid(form)) {
    applyErrors(apiErrors, validator.errors(form, apiErrors));
    return;
  }

  try {
    await createVconnect(deepUnref(form));

    successToast('Verida Wallet Connection saved.');
    closeDialog();
  }
  catch (error) {
    errorToast(getErrorMessage(error, 'Could not update Verdia Wallet Connection.'));
  }
};
</script>
