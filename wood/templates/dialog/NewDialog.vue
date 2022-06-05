<template>
  <Dialog
    :visible="visible"
    :style="{ width: '50vw', 'max-width': '500px' }"
    :breakpoints="{'640px': '100vw'}"
    :closable="false"
    header="New ###_UC_NAME_###"
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
        :disabled="$isLoading('create###_PASCAL_NAME_###')"
      />
    </form>

    <div class="dialog-buttons">
      <loading-spinner
        v-if="$isLoading('create###_PASCAL_NAME_###')"
        :size-class="'fa-2x'"
      />

      <button
        :disabled="$isLoading('create###_PASCAL_NAME_###')"
        @click="closeDialog"
      >
        Cancel
      </button>

      <button
        class="btn-primary"
        :disabled="! formValid || $isLoading('create###_PASCAL_NAME_###')"
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
  ###_PASCAL_NAME_###Validator,
  ###_UPPER_SNAKE_NAME_###_FORM_FIELDS,
} from '#features/###_FEATURE_NAME_###/lib/validators/###_PASCAL_NAME_###Validator';
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
const validator = new ###_PASCAL_NAME_###Validator(###_UPPER_SNAKE_NAME_###_FORM_FIELDS);
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

// New ###_PASCAL_NAME_###

const create###_PASCAL_NAME_### = loadable(
  (values) => store.dispatch('###_PASCAL_PLURAL_NAME_###/create###_PASCAL_NAME_###', values),
  'create###_PASCAL_NAME_###',
  getCurrentInstance(),
);
const submit = async () => {
  resetApiErrors();

  if (! validator.valid(form)) {
    applyErrors(apiErrors, validator.errors(form, apiErrors));
    return;
  }

  try {
    await create###_PASCAL_NAME_###(deepUnref(form));

    successToast('###_PASCAL_NAME_### saved.');
    closeDialog();
  }
  catch (error) {
    errorToast(getErrorMessage(error, 'Could not update ###_PASCAL_NAME_###.'));
  }
};
</script>
