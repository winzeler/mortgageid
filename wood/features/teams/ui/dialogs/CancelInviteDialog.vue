<template>
  <Dialog
    :visible="visible"
    :style="{ width: '50vw', 'max-width': '500px' }"
    :breakpoints="{'640px': '100vw'}"
    :closable="false"
    header="Cancel Invite"
  >
    <div class="dialog-body">
      Are you sure you want to cancel the invite for <strong>{{ inviteName }}</strong>?
    </div>

    <div class="dialog-buttons">
      <loading-spinner
        v-if="$isLoading('cancelInvite')"
        :size-class="'fa-2x'"
      />

      <button
        :disabled="$isLoading('cancelInvite')"
        @click="closeDialog"
      >
        No
      </button>

      <button
        class="btn-primary"
        :disabled="$isLoading('cancelInvite')"
        @click="submit"
      >
        Yes, Cancel Invite
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
const inviteEmail = ref('');
const inviteName = ref('');

// Open/close

const visible = ref(false);
const openDialog = (invite) => {
  inviteEmail.value = invite.email;
  inviteName.value = invite.name;

  visible.value = true;
};
const closeDialog = () => {
  visible.value = false;
};
defineExpose({ openDialog, closeDialog });

// Cancel invite

const cancelInvite = loadable(
  (values) => store.dispatch('TeamMembers/cancelInvite', values),
  'cancelInvite',
  getCurrentInstance(),
);
const submit = async () => {
  try {
    await cancelInvite({ email: inviteEmail.value });
    successToast('Invite cancelled.');
    closeDialog();
  }
  catch (error) {
    errorToast(getErrorMessage(error, 'Could not cancel invite.'));
  }
};
</script>
