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
        :disabled="$isLoading('update###_PASCAL_NAME_###')"
      />
    </form>

    <div class="dialog-buttons">
      <loading-spinner
        v-if="$isLoading('update###_PASCAL_NAME_###')"
        :size-class="'fa-2x'"
      />

      <button
        :disabled="$isLoading('update###_PASCAL_NAME_###')"
        @click="closeDialog"
      >
        Cancel
      </button>

      <button
        class="btn-primary"
        :disabled="! formValid || $isLoading('update###_PASCAL_NAME_###')"
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
  ###_PASCAL_NAME_###Validator,
  ###_UPPER_SNAKE_NAME_###_FORM_FIELDS,
} from '#features/###_FEATURE_NAME_###/lib/validators/###_PASCAL_NAME_###Validator';

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
const validator = new ###_PASCAL_NAME_###Validator(###_UPPER_SNAKE_NAME_###_FORM_FIELDS);
const nameErrorText = computed(fieldErrorText('name', validator, form, apiErrors));
const formValid = computed(() => validator.valid(form));
const resetApiErrors = () => {
  apiErrors.name.value = [];
};

// Open/close

const visible = ref(false);
const openDialog = (###_CAMEL_NAME_###) => {
  id.value = ###_CAMEL_NAME_###.id;
  form.name.value = ###_CAMEL_NAME_###.name;

  visible.value = true;
};
const closeDialog = () => {
  form.name.value = '';
  apiErrors.name.value = [];
  visible.value = false;
};
defineExpose({ openDialog, closeDialog });

// Edit ###_PASCAL_NAME_###

const update###_PASCAL_NAME_### = loadable(
  (values) => store.dispatch('###_PASCAL_PLURAL_NAME_###/update###_PASCAL_NAME_###', values),
  'update###_PASCAL_NAME_###',
  getCurrentInstance(),
);
const submit = async () => {
  resetApiErrors();

  if (! validator.valid(deepUnref(form))) {
    applyErrors(apiErrors, validator.errors(deepUnref(form), apiErrors));
    return;
  }

  try {
    await update###_PASCAL_NAME_###({ id: id.value, ...deepUnref(form) });
    closeDialog();
    successToast('###_UC_NAME_### updated.');
  }
  catch (error) {
    errorToast(getErrorMessage(error, 'Could not update ###_UC_NAME_###.'));
  }
};
</script>
