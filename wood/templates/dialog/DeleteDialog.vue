<template>
  <Dialog
    :visible="visible"
    :style="{ width: '50vw', 'max-width': '500px' }"
    :breakpoints="{'640px': '100vw'}"
    :closable="false"
    :header="`Delete '${###_CAMEL_NAME_###Name}'`"
  >
    <div class="dialog-body">
      <p>Are you sure you wish to delete this ###_SINGULAR_NAME_###?</p>
    </div>

    <div class="dialog-buttons">
      <loading-spinner
        v-if="$isLoading('delete###_PASCAL_NAME_###')"
        :size-class="'fa-2x'"
      />

      <button
        :disabled="$isLoading('delete###_PASCAL_NAME_###')"
        @click="closeDialog"
      >
        Cancel
      </button>

      <button
        class="btn-primary"
        :disabled="$isLoading('delete###_PASCAL_NAME_###')"
        @click="submit"
      >
        Delete ###_SINGULAR_NAME_###
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
const ###_CAMEL_NAME_###Name = ref('');

// Open/close

const visible = ref(false);
const openDialog = (###_CAMEL_NAME_###) => {
  id.value = ###_CAMEL_NAME_###.id;
  ###_CAMEL_NAME_###Name.value = ###_CAMEL_NAME_###.name;

  visible.value = true;
};
const closeDialog = () => {
  visible.value = false;
};
defineExpose({ openDialog, closeDialog });

// Delete

const delete###_PASCAL_NAME_### = loadable(
  (values) => store.dispatch('###_PASCAL_PLURAL_NAME_###/delete###_PASCAL_NAME_###', values),
  'delete###_PASCAL_NAME_###',
  getCurrentInstance(),
);
const submit = async () => {
  try {
    await delete###_PASCAL_NAME_###({ id: id.value });
    closeDialog();
    successToast('###_UC_NAME_### deleted.');
  }
  catch (error) {
    errorToast(getErrorMessage(error, 'Could not delete ###_SINGULAR_NAME_###.'));
  }
};
</script>
