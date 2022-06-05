<template>
  <div class="card">
    <h2 class="card-header">
      Mortgage Credit Scores
    </h2>
    <div class="card-body">
      <DataTable
        :fields="creditFields"
        :rows="currentPage"
        :total-pages="totalPages"
        :search-enabled="true"
        :load-list="getList"
        :is-loading="$isLoading('getListCredit')"
        :actions="creditActions"
        :empty-message="'No credit scores'"
        class="w-full"
      />

      <div class="flex flex-row-reverse mt-4">
        <button
          :disabled="$isLoading('getListCredit')"
          @click="$refs.newCreditDialog.openDialog()"
        >
          New Credit Score
        </button>
      </div>
    </div>

    <NewCreditDialog ref="newCreditDialog" />
    <EditCreditDialog ref="editCreditDialog" />
    <DeleteCreditDialog ref="deleteCreditDialog" />
  </div>
</template>

<script setup>
import { computed, ref, getCurrentInstance } from 'vue';
import { useStore } from 'vuex';
import omit from 'lodash/omit';
import { loadable } from 'vue-is-loading';
import DataTable from '#ui/components/DataTable';
import { CREDIT_MODEL_FIELDS } from '#features/credit/lib/models/CreditModel';
import NewCreditDialog from '#features/credit/ui/dialogs/NewCreditDialog';
import EditCreditDialog from '#features/credit/ui/dialogs/EditCreditDialog';
import DeleteCreditDialog from '#features/credit/ui/dialogs/DeleteCreditDialog';

// Setup

const store = useStore();
const currentPage = computed(() => store.state.Credits.currentPage);
const totalPages = computed(() => store.state.Credits.totalPages);
const creditFields = computed(() => omit(CREDIT_MODEL_FIELDS, 'id'));

// List navigation

const getList = loadable(
  (values) => store.dispatch('Credits/getList', values),
  'getListCredit',
  getCurrentInstance(),
);

// Row actions

const editCreditDialog = ref(null);
const openEditDialog = (team) => {
  editCreditDialog.value.openDialog(team);
};

const deleteCreditDialog = ref(null);
const openDeleteDialog = (team) => {
  deleteCreditDialog.value.openDialog(team);
};

const creditActions = [
  { name: 'Edit Credit', fn: openEditDialog },
  { name: 'Delete Credit', fn: openDeleteDialog },
];
</script>
