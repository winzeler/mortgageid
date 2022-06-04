<template>
  <Dialog
    :visible="visible"
    :style="{ width: '50vw', 'max-width': '500px' }"
    :breakpoints="{'640px': '100vw'}"
    :closable="false"
    :header="removeDialogHeader"
  >
    <!-- eslint-disable vue/no-v-html -->
    <div
      class="dialog-body"
      v-html="removeDialogBody"
    />
    <!-- eslint-enable -->

    <div class="dialog-buttons">
      <loading-spinner
        v-if="$isLoading('removeMember')"
        :size-class="'fa-2x'"
      />

      <button
        :disabled="$isLoading('removeMember')"
        @click="closeDialog"
      >
        No
      </button>

      <button
        class="btn-primary"
        :disabled="$isLoading('removeMember')"
        @click="submit"
      >
        {{ removeDialogAction }}
      </button>
    </div>
  </Dialog>
</template>

<script setup>
import { computed, ref, getCurrentInstance } from 'vue';
import { useStore } from 'vuex';
import { loadable } from 'vue-is-loading';
import { getErrorMessage } from '#lib/Errors';
import { getLanguageString } from '#lib/Config';
import { successToast, errorToast } from '#ui/lib/toast';
import LoadingSpinner from '#ui/components/LoadingSpinner';

// Setup

const store = useStore();
const memberId = ref('');
const memberName = ref('');

const removeDialogHeader = computed(() => getLanguageString('teams', 'removeDialogHeader'));
const removeDialogAction = computed(() => getLanguageString('teams', 'removeDialogAction'));
const removeDialogBody = computed(() => getLanguageString('teams', 'removeDialogBody', { memberName: memberName.value }));

// Open/close

const visible = ref(false);
const openDialog = (member) => {
  memberId.value = member.id;
  memberName.value = member.name;

  visible.value = true;
};
const closeDialog = () => {
  visible.value = false;
};
defineExpose({ openDialog, closeDialog });

// Remove member

const removeMember = loadable(
  (values) => store.dispatch('TeamMembers/removeMember', values),
  'removeMember',
  getCurrentInstance(),
);
const submit = async () => {
  try {
    await removeMember({ id: memberId.value });
    successToast(getLanguageString('teams', 'removeDialogSuccess'));
    closeDialog();
  }
  catch (error) {
    errorToast(getErrorMessage(error, getLanguageString('teams', 'removeDialogError')));
  }
};
</script>
