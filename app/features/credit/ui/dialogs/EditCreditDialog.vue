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
        label="Score"
        :error-text="nameErrorText"
        :disabled="$isLoading('updateCredit')"
      />
    </form>

    <div class="dialog-buttons">
      <loading-spinner
        v-if="$isLoading('updateCredit')"
        :size-class="'fa-2x'"
      />

      <button
        :disabled="$isLoading('updateCredit')"
        @click="closeDialog"
      >
        Cancel
      </button>

      <button
        class="btn-primary"
        :disabled="! formValid || $isLoading('updateCredit')"
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
  CreditValidator,
  CREDIT_FORM_FIELDS,
} from '#features/credit/lib/validators/CreditValidator';

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
const validator = new CreditValidator(CREDIT_FORM_FIELDS);
const nameErrorText = computed(fieldErrorText('name', validator, form, apiErrors));
const formValid = computed(() => validator.valid(form));
const resetApiErrors = () => {
  apiErrors.name.value = [];
};

// Open/close

const visible = ref(false);
const openDialog = (credit) => {
  id.value = credit.id;
  form.name.value = credit.name;

  visible.value = true;
};
const closeDialog = () => {
  form.name.value = '';
  apiErrors.name.value = [];
  visible.value = false;
};
defineExpose({ openDialog, closeDialog });

// Edit Credit

const updateCredit = loadable(
  (values) => store.dispatch('Credits/updateCredit', values),
  'updateCredit',
  getCurrentInstance(),
);
const submit = async () => {
  resetApiErrors();

  if (! validator.valid(deepUnref(form))) {
    applyErrors(apiErrors, validator.errors(deepUnref(form), apiErrors));
    return;
  }

  try {
    await updateCredit({ id: id.value, ...deepUnref(form) });
    closeDialog();
    successToast('Credit updated.');
  }
  catch (error) {
    errorToast(getErrorMessage(error, 'Could not update Credit.'));
  }
};
</script>
