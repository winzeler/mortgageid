<template>
  <Dialog
    :visible="visible"
    :style="{ width: '50vw', 'max-width': '500px' }"
    :breakpoints="{'640px': '100vw'}"
    :closable="false"
    header="Dialog Title"
  >
    <div class="dialog-body">
      Dialog Body
    </div>

    <div class="dialog-buttons">
      <loading-spinner
        v-if="false"
        :size-class="'fa-2x'"
      />

      <button @click="closeDialog">
        Close
      </button>
    </div>
  </Dialog>
</template>

<script setup>
import { ref } from 'vue';
import LoadingSpinner from '#ui/components/LoadingSpinner';

// Open/close

const visible = ref(false);
const openDialog = () => {
  visible.value = true;
};
const closeDialog = () => {
  visible.value = false;
};
defineExpose({ openDialog, closeDialog });
</script>
