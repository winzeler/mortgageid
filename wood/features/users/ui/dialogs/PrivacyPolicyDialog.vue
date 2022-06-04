<template>
  <Dialog
    :visible="visible"
    :style="{ width: '60vw', 'height': '75vh' }"
    :breakpoints="{'640px': '100vw'}"
    :closable="false"
    header="Privacy Policy"
  >
    <div class="dialog-body">
      <privacy-policy />
    </div>

    <div class="dialog-buttons">
      <button
        class="btn"
        @click="closeDialog"
      >
        Close
      </button>
    </div>
  </Dialog>
</template>

<script setup>
import { ref } from 'vue';
import PrivacyPolicy from '#ui/views/PrivacyPolicy';

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
