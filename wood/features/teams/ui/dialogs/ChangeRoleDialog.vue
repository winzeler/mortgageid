<template>
  <Dialog
    :visible="visible"
    :style="{ width: '50vw', 'max-width': '500px' }"
    :breakpoints="{'640px': '100vw'}"
    :closable="false"
    :header="dialogTitle"
  >
    <div class="dialog-body">
      <role-picker v-model="selectedRole" />
    </div>

    <div class="dialog-buttons">
      <loading-spinner
        v-if="$isLoading('updateMember')"
        :size-class="'fa-2x'"
      />

      <button
        :disabled="$isLoading('updateMember')"
        @click="closeDialog"
      >
        Cancel
      </button>

      <button
        class="btn-primary"
        :disabled="submitDisabled"
        @click="submit"
      >
        Change Role
      </button>
    </div>
  </Dialog>
</template>

<script setup>
import { computed, ref, getCurrentInstance } from 'vue';
import { useStore } from 'vuex';
import { loadable } from 'vue-is-loading';
import { getErrorMessage } from '#lib/Errors';
import { successToast, errorToast } from '#ui/lib/toast';
import RolePicker from '#features/teams/ui/components/RolePicker';
import LoadingSpinner from '#ui/components/LoadingSpinner';

// Setup

const instance = getCurrentInstance();
const store = useStore();
const memberId = ref('');
const selectedRole = ref('');
const dialogTitle = ref('');
let originalRole = '';

// Open/close

const visible = ref(false);
const openDialog = (member) => {
  memberId.value = member.id;
  selectedRole.value = member.role.id;
  originalRole = member.role.id;
  dialogTitle.value = `Change Role for ${member.name}`;

  visible.value = true;
};
const closeDialog = () => {
  visible.value = false;
};
defineExpose({ openDialog, closeDialog });

// Change role

const updateMember = loadable(
  (values) => store.dispatch('TeamMembers/updateMember', values),
  'updateMember',
  instance,
);
const submit = async () => {
  try {
    await updateMember({ id: memberId.value, role: selectedRole.value });

    successToast('Role changed.');
    closeDialog();
  }
  catch (error) {
    errorToast(getErrorMessage(error, 'Could not change role.'));
  }
};

const submitDisabled = computed(
  () => selectedRole.value === ''
    || instance.ctx.$isLoading('updateMember')
    || selectedRole.value === originalRole,
);
</script>
