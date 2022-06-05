<template>
  <div class="card">
    <h2 class="card-header">
      veridaConnects
    </h2>
    <div class="card-body">
      <DataTable
        :fields="veridaConnectFields"
        :rows="currentPage"
        :total-pages="totalPages"
        :search-enabled="true"
        :load-list="getList"
        :is-loading="$isLoading('getListVeridaConnect')"
        :actions="veridaConnectActions"
        :empty-message="'No veridaConnects'"
        class="w-full"
      />

      <div class="flex flex-row-reverse mt-4">
        <button
          :disabled="$isLoading('getListVeridaConnect')"
          @click="$refs.newVeridaConnectDialog.openDialog()"
        >
          New Verida Connect
        </button>
      </div>
    </div>

    <NewVeridaConnectDialog ref="newVeridaConnectDialog" />
    <EditVeridaConnectDialog ref="editVeridaConnectDialog" />
    <DeleteVeridaConnectDialog ref="deleteVeridaConnectDialog" />
  </div>
</template>

<script setup>
import { computed, ref, getCurrentInstance } from 'vue';
import { useStore } from 'vuex';
import omit from 'lodash/omit';
import { loadable } from 'vue-is-loading';
import DataTable from '#ui/components/DataTable';
import { VERIDA_CONNECT_MODEL_FIELDS } from '#features/verida-connect/lib/models/VeridaConnectModel';
import NewVeridaConnectDialog from '#features/verida-connect/ui/dialogs/NewVeridaConnectDialog';
import EditVeridaConnectDialog from '#features/verida-connect/ui/dialogs/EditVeridaConnectDialog';
import DeleteVeridaConnectDialog from '#features/verida-connect/ui/dialogs/DeleteVeridaConnectDialog';

// Setup

const store = useStore();
const currentPage = computed(() => store.state.VeridaConnects.currentPage);
const totalPages = computed(() => store.state.VeridaConnects.totalPages);
const veridaConnectFields = computed(() => omit(VERIDA_CONNECT_MODEL_FIELDS, 'id'));

// List navigation

const getList = loadable(
  (values) => store.dispatch('VeridaConnects/getList', values),
  'getListVeridaConnect',
  getCurrentInstance(),
);

// Row actions

const editVeridaConnectDialog = ref(null);
const openEditDialog = (team) => {
  editVeridaConnectDialog.value.openDialog(team);
};

const deleteVeridaConnectDialog = ref(null);
const openDeleteDialog = (team) => {
  deleteVeridaConnectDialog.value.openDialog(team);
};

const veridaConnectActions = [
  { name: 'Edit Verida Connect', fn: openEditDialog },
  { name: 'Delete Verida Connect', fn: openDeleteDialog },
];
</script>
