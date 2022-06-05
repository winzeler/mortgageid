<template>
  <div class="card">
    <h2 class="card-header">
      Verida Wallets
    </h2>
    <div class="card-body">
      <DataTable
        :fields="vconnectFields"
        :rows="currentPage"
        :total-pages="totalPages"
        :search-enabled="true"
        :load-list="getList"
        :is-loading="$isLoading('getListVconnect')"
        :actions="vconnectActions"
        :empty-message="'No Verida Wallets'"
        class="w-full"
      />

      <div class="flex flex-row-reverse mt-4">
        <button
          :disabled="$isLoading('getListVconnect')"
          @click="$refs.newVconnectDialog.openDialog()"
        >
          New Verida Wallet Connection
        </button>
      </div>
    </div>

    <NewVconnectDialog ref="newVconnectDialog" />
    <EditVconnectDialog ref="editVconnectDialog" />
    <DeleteVconnectDialog ref="deleteVconnectDialog" />
  </div>
</template>

<script setup>
import { computed, ref, getCurrentInstance } from 'vue';
import { useStore } from 'vuex';
import omit from 'lodash/omit';
import { loadable } from 'vue-is-loading';
import DataTable from '#ui/components/DataTable';
import { VCONNECT_MODEL_FIELDS } from '#features/vconnect/lib/models/VconnectModel';
import NewVconnectDialog from '#features/vconnect/ui/dialogs/NewVconnectDialog';
import EditVconnectDialog from '#features/vconnect/ui/dialogs/EditVconnectDialog';
import DeleteVconnectDialog from '#features/vconnect/ui/dialogs/DeleteVconnectDialog';

// Setup

const store = useStore();
const currentPage = computed(() => store.state.Vconnects.currentPage);
const totalPages = computed(() => store.state.Vconnects.totalPages);
const vconnectFields = computed(() => omit(VCONNECT_MODEL_FIELDS, 'id'));

// List navigation

const getList = loadable(
  (values) => store.dispatch('Vconnects/getList', values),
  'getListVconnect',
  getCurrentInstance(),
);

// Row actions

const editVconnectDialog = ref(null);
const openEditDialog = (team) => {
  editVconnectDialog.value.openDialog(team);
};

const deleteVconnectDialog = ref(null);
const openDeleteDialog = (team) => {
  deleteVconnectDialog.value.openDialog(team);
};

const vconnectActions = [
  { name: 'Edit Wallet Name', fn: openEditDialog },
  { name: 'Delete Verida Connection', fn: openDeleteDialog },
];
</script>
