<template>
  <Dialog
    :visible="visible"
    :style="{ width: '50vw', 'max-width': '500px' }"
    :breakpoints="{'640px': '100vw'}"
    :closable="false"
    header="Delete Team"
  >
    <div class="dialog-body">
      <p>
        <strong>CAUTION:</strong> This will delete the team and all of its data!
      </p>
      <p>Do you want to delete team "{{ name }}"?</p>
    </div>

    <div class="dialog-buttons">
      <loading-spinner
        v-if="$isLoading('deleteTeam')"
        :size-class="'fa-2x'"
      />

      <button
        :disabled="$isLoading('deleteTeam')"
        @click="closeDialog"
      >
        No
      </button>

      <button
        class="btn-primary"
        :disabled="$isLoading('deleteTeam')"
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
import { getErrorMessage } from '#lib/Errors';
import { successToast, errorToast } from '#ui/lib/toast';
import LoadingSpinner from '#ui/components/LoadingSpinner';

// Setup

const store = useStore();
const id = ref(null);
const name = ref('');

// Open/close

const visible = ref(false);
const openDialog = (team) => {
  id.value = team.id;
  name.value = team.name;

  visible.value = true;
};
const closeDialog = () => {
  visible.value = false;
};
defineExpose({ openDialog, closeDialog });

// Delete

const deleteTeam = loadable(
  (values) => store.dispatch('AdminTeams/deleteTeam', values),
  'deleteTeam',
  getCurrentInstance(),
);
const submit = async () => {
  try {
    await deleteTeam({ id: id.value });
    successToast('Team deleted.');
    closeDialog();
  }
  catch (error) {
    errorToast(getErrorMessage(error, 'Could not delete team.'));
  }
};
</script>
