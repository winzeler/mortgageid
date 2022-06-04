<template>
  <Dialog
    :visible="visible"
    :style="{ width: '60vw', 'height': '75vh' }"
    :breakpoints="{'640px': '100vw'}"
    :closable="false"
    header="Terms of Service"
  >
    <div class="dialog-body">
      <terms-of-service />
    </div>

    <div class="dialog-buttons">
      <button @click="closeDialog">
        Close
      </button>
    </div>
  </Dialog>
</template>

<script setup>
import { ref } from 'vue';
import TermsOfService from '#ui/views/TermsOfService';

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
