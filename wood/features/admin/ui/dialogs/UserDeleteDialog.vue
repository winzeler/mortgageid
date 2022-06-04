<template>
  <Dialog
    :visible="visible"
    :style="{ width: '50vw', 'max-width': '500px' }"
    :breakpoints="{'640px': '100vw'}"
    :closable="false"
    header="Delete User"
  >
    <div class="dialog-body">
      Do you want to delete {{ name }}?
    </div>

    <div class="dialog-buttons">
      <loading-spinner
        v-if="$isLoading('deleteUser')"
        :size-class="'fa-2x'"
      />

      <button
        :disabled="$isLoading('deleteUser')"
        @click="closeDialog"
      >
        No
      </button>

      <button
        class="btn-primary"
        :disabled="$isLoading('deleteUser')"
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
import { successToast, errorToast } from '#ui/lib/toast';
import { getErrorMessage } from '#lib/Errors';
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

// Delete

const deleteUser = loadable(
  (values) => store.dispatch('AdminUsers/deleteUser', values),
  'deleteUser',
  getCurrentInstance(),
);
const submit = async () => {
  try {
    await deleteUser({ id: id.value });
    successToast('User deleted.');
    closeDialog();
  }
  catch (error) {
    errorToast(getErrorMessage(error, 'Could not delete user.'));
  }
};
</script>
