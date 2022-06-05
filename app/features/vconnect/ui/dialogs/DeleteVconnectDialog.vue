<template>
  <Dialog
    :visible="visible"
    :style="{ width: '50vw', 'max-width': '500px' }"
    :breakpoints="{'640px': '100vw'}"
    :closable="false"
    :header="`Delete '${vconnectName}'`"
  >
    <div class="dialog-body">
      <p>Are you sure you wish to delete this Verida Wallet?</p>
    </div>

    <div class="dialog-buttons">
      <loading-spinner
        v-if="$isLoading('deleteVconnect')"
        :size-class="'fa-2x'"
      />

      <button
        :disabled="$isLoading('deleteVconnect')"
        @click="closeDialog"
      >
        Cancel
      </button>

      <button
        class="btn-primary"
        :disabled="$isLoading('deleteVconnect')"
        @click="submit"
      >
        Delete Verida Connection
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
const id = ref(0);
const vconnectName = ref('');

// Open/close

const visible = ref(false);
const openDialog = (vconnect) => {
  id.value = vconnect.id;
  vconnectName.value = vconnect.name;

  visible.value = true;
};
const closeDialog = () => {
  visible.value = false;
};
defineExpose({ openDialog, closeDialog });

// Delete

const deleteVconnect = loadable(
  (values) => store.dispatch('Vconnects/deleteVconnect', values),
  'deleteVconnect',
  getCurrentInstance(),
);
const submit = async () => {
  try {
    await deleteVconnect({ id: id.value });
    closeDialog();
    successToast('Verida Connect Deleted.');
  }
  catch (error) {
    errorToast(getErrorMessage(error, 'Could not delete Verida Connection.'));
  }
};
</script>
