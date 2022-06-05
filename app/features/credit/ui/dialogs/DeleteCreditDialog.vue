<template>
  <Dialog
    :visible="visible"
    :style="{ width: '50vw', 'max-width': '500px' }"
    :breakpoints="{'640px': '100vw'}"
    :closable="false"
    :header="`Delete '${creditName}'`"
  >
    <div class="dialog-body">
      <p>Are you sure you wish to delete this credit?</p>
    </div>

    <div class="dialog-buttons">
      <loading-spinner
        v-if="$isLoading('deleteCredit')"
        :size-class="'fa-2x'"
      />

      <button
        :disabled="$isLoading('deleteCredit')"
        @click="closeDialog"
      >
        Cancel
      </button>

      <button
        class="btn-primary"
        :disabled="$isLoading('deleteCredit')"
        @click="submit"
      >
        Delete credit
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
const creditName = ref('');

// Open/close

const visible = ref(false);
const openDialog = (credit) => {
  id.value = credit.id;
  creditName.value = credit.name;

  visible.value = true;
};
const closeDialog = () => {
  visible.value = false;
};
defineExpose({ openDialog, closeDialog });

// Delete

const deleteCredit = loadable(
  (values) => store.dispatch('Credits/deleteCredit', values),
  'deleteCredit',
  getCurrentInstance(),
);
const submit = async () => {
  try {
    await deleteCredit({ id: id.value });
    closeDialog();
    successToast('Credit Score deleted.');
  }
  catch (error) {
    errorToast(getErrorMessage(error, 'Could not delete credit score.'));
  }
};
</script>
