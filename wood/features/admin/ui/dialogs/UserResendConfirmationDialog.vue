<template>
  <Dialog
    :visible="visible"
    :style="{ width: '50vw', 'max-width': '500px' }"
    :breakpoints="{'640px': '100vw'}"
    :closable="false"
    header="Resend Email Confirmation for User"
  >
    <div class="dialog-body">
      Do you want to send an email confirmation email to {{ name }}?
    </div>

    <div class="dialog-buttons">
      <loading-spinner
        v-if="$isLoading('resendConfirmation')"
        :size-class="'fa-2x'"
      />

      <button
        :disabled="$isLoading('resendConfirmation')"
        @click="closeDialog"
      >
        No
      </button>

      <button
        class="btn-primary"
        :disabled="$isLoading('resendConfirmation')"
        @click="submit"
      >
        Yes
      </button>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, getCurrentInstance } from 'vue';
import { useStore } from 'vuex';
import { loadable } from 'vue-is-loading';
import { getErrorMessage } from '#lib/Errors';
import { successToast, errorToast } from '#ui/lib/toast';
import LoadingSpinner from '#ui/components/LoadingSpinner';

// Setup

const store = useStore();
const id = ref(null);
const name = ref('');

// Open/close

const visible = ref(false);
const openDialog = (user) => {
  id.value = user.id;
  name.value = user.name;

  visible.value = true;
};
const closeDialog = () => {
  visible.value = false;
};
defineExpose({ openDialog, closeDialog });

// Resend Confirmation

const resendUserEmailConfirmation = loadable(
  (values) => store.dispatch('AdminUsers/resendUserEmailConfirmation', values),
  'resendConfirmation',
  getCurrentInstance(),
);
const submit = async () => {
  try {
    await resendUserEmailConfirmation({ id: id.value });
    successToast('Email confirmation email sent.');
    closeDialog();
  }
  catch (error) {
    errorToast(getErrorMessage(error, 'Could not resend confirmation.'));
  }
};
</script>
