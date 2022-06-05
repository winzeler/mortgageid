<template>
  <Dialog
    :visible="visible"
    :style="{ width: '50vw', 'max-width': '500px' }"
    :breakpoints="{'640px': '100vw'}"
    :closable="false"
    header="Cancel Subscription"
  >
    <div class="dialog-body">
      <label for="cancel-reason">
        While you're on your way out, it would really help us to improve if you would let us
        know why you're leaving:

        <textarea
          id="cancel-reason"
          v-model="message"
          class="block mt-6 mb-2 w-full h-32 mx-auto border border-themeBackground-500 rounded"
          :disabled="$isLoading('cancelSubscription')"
        />
      </label>
    </div>

    <div class="dialog-buttons">
      <loading-spinner
        v-if="$isLoading('cancelSubscription')"
        :size-class="'fa-2x'"
      />

      <button @click="closeDialog">
        I've Changed My Mind...
      </button>

      <button
        class="btn-critical"
        :disabled="$isLoading('cancelSubscription')"
        @click="submit"
      >
        Cancel Subscription
      </button>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, getCurrentInstance } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { loadable } from 'vue-is-loading';
import { successToast } from '#ui/lib/toast';
import LoadingSpinner from '#ui/components/LoadingSpinner';

// Setup

const store = useStore();
const router = useRouter();
const message = ref('');

// Open/close

const visible = ref(false);
const openDialog = () => {
  visible.value = true;
};
const closeDialog = () => {
  visible.value = false;
};
defineExpose({ openDialog, closeDialog });

// Cancel subscription

const cancelSubscription = loadable(
  (values) => store.dispatch('Subscriptions/cancelSubscription', values),
  'cancelSubscription',
  getCurrentInstance(),
);
const submit = async () => {
  await cancelSubscription({ message: message.value });
  router.push({ name: 'subscription' });
  successToast('Subscription cancelled.');
};
</script>
