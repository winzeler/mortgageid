<template>
  <Dialog
    :visible="visible"
    :style="{ width: '50vw', 'max-width': '500px' }"
    :breakpoints="{'640px': '100vw'}"
    :closable="false"
    :header="`Delete '${veridaConnectName}'`"
  >
    <div class="dialog-body">
      <p>Are you sure you wish to delete this veridaConnect?</p>
    </div>

    <div class="dialog-buttons">
      <loading-spinner
        v-if="$isLoading('deleteVeridaConnect')"
        :size-class="'fa-2x'"
      />

      <button
        :disabled="$isLoading('deleteVeridaConnect')"
        @click="closeDialog"
      >
        Cancel
      </button>

      <button
        class="btn-primary"
        :disabled="$isLoading('deleteVeridaConnect')"
        @click="submit"
      >
        Delete veridaConnect
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
const veridaConnectName = ref('');

// Open/close

const visible = ref(false);
const openDialog = (veridaConnect) => {
  id.value = veridaConnect.id;
  veridaConnectName.value = veridaConnect.name;

  visible.value = true;
};
const closeDialog = () => {
  visible.value = false;
};
defineExpose({ openDialog, closeDialog });

// Delete

const deleteVeridaConnect = loadable(
  (values) => store.dispatch('VeridaConnects/deleteVeridaConnect', values),
  'deleteVeridaConnect',
  getCurrentInstance(),
);
const submit = async () => {
  try {
    await deleteVeridaConnect({ id: id.value });
    closeDialog();
    successToast('Verida Connect deleted.');
  }
  catch (error) {
    errorToast(getErrorMessage(error, 'Could not delete veridaConnect.'));
  }
};
</script>
