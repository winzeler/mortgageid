<template>
  <div class="card">
    <h2 class="card-header">
      ###_PLURAL_NAME_###
    </h2>
    <div class="card-body">
      <DataTable
        :fields="###_CAMEL_NAME_###Fields"
        :rows="currentPage"
        :total-pages="totalPages"
        :search-enabled="true"
        :load-list="getList"
        :is-loading="$isLoading('getList###_PASCAL_NAME_###')"
        :actions="###_CAMEL_NAME_###Actions"
        :empty-message="'No ###_PLURAL_NAME_###'"
        class="w-full"
      />

      <div class="flex flex-row-reverse mt-4">
        <button
          :disabled="$isLoading('getList###_PASCAL_NAME_###')"
          @click="$refs.new###_PASCAL_NAME_###Dialog.openDialog()"
        >
          New ###_UC_NAME_###
        </button>
      </div>
    </div>

    <New###_PASCAL_NAME_###Dialog ref="new###_PASCAL_NAME_###Dialog" />
    <Edit###_PASCAL_NAME_###Dialog ref="edit###_PASCAL_NAME_###Dialog" />
    <Delete###_PASCAL_NAME_###Dialog ref="delete###_PASCAL_NAME_###Dialog" />
  </div>
</template>

<script setup>
import { computed, ref, getCurrentInstance } from 'vue';
import { useStore } from 'vuex';
import omit from 'lodash/omit';
import { loadable } from 'vue-is-loading';
import DataTable from '#ui/components/DataTable';
import { ###_UPPER_SNAKE_NAME_###_MODEL_FIELDS } from '#features/###_FEATURE_NAME_###/lib/models/###_PASCAL_NAME_###Model';
import New###_PASCAL_NAME_###Dialog from '#features/###_FEATURE_NAME_###/ui/dialogs/New###_PASCAL_NAME_###Dialog';
import Edit###_PASCAL_NAME_###Dialog from '#features/###_FEATURE_NAME_###/ui/dialogs/Edit###_PASCAL_NAME_###Dialog';
import Delete###_PASCAL_NAME_###Dialog from '#features/###_FEATURE_NAME_###/ui/dialogs/Delete###_PASCAL_NAME_###Dialog';

// Setup

const store = useStore();
const currentPage = computed(() => store.state.###_PASCAL_PLURAL_NAME_###.currentPage);
const totalPages = computed(() => store.state.###_PASCAL_PLURAL_NAME_###.totalPages);
const ###_CAMEL_NAME_###Fields = computed(() => omit(###_UPPER_SNAKE_NAME_###_MODEL_FIELDS, 'id'));

// List navigation

const getList = loadable(
  (values) => store.dispatch('###_PASCAL_PLURAL_NAME_###/getList', values),
  'getList###_PASCAL_NAME_###',
  getCurrentInstance(),
);

// Row actions

const edit###_PASCAL_NAME_###Dialog = ref(null);
const openEditDialog = (team) => {
  edit###_PASCAL_NAME_###Dialog.value.openDialog(team);
};

const delete###_PASCAL_NAME_###Dialog = ref(null);
const openDeleteDialog = (team) => {
  delete###_PASCAL_NAME_###Dialog.value.openDialog(team);
};

const ###_CAMEL_NAME_###Actions = [
  { name: 'Edit ###_UC_NAME_###', fn: openEditDialog },
  { name: 'Delete ###_UC_NAME_###', fn: openDeleteDialog },
];
</script>
