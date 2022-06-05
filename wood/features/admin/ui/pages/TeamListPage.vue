<template>
  <div class="card w-full mx-auto">
    <h2 class="card-header">
      Teams
    </h2>
    <div class="card-body">
      <data-table
        :fields="teamFields"
        :rows="currentPage"
        :total-pages="totalPages"
        :search-enabled="true"
        :search-label="'Search (Name)'"
        :load-list="getList"
        :is-loading="$isLoading('getList')"
        :actions="teamActions"
        class="w-full"
      />
    </div>

    <team-edit-dialog ref="teamEditDialog" />
    <team-delete-dialog ref="teamDeleteDialog" />
  </div>
</template>

<script>
import { mapLoadableMethods } from 'vue-is-loading';
import { mapActions, mapState } from 'vuex';
import pick from 'lodash/pick';
import { TEAM_MODEL_FIELDS } from '#features/teams/lib/models/TeamModel';
import TeamEditDialog from '#features/admin/ui/dialogs/TeamEditDialog';
import TeamDeleteDialog from '#features/admin/ui/dialogs/TeamDeleteDialog';
import DataTable from '#ui/components/DataTable';
import { getConfig } from '#lib/Config';

export default {
  name: 'TeamListPage',

  components: {
    TeamEditDialog,
    TeamDeleteDialog,
    DataTable,
  },

  computed: {
    ...mapState('AdminTeams', [
      'currentPage',
      'totalPages',
    ]),

    /**
     * The fields to display in the team list.
     *
     * @return {Array<FieldDisplay>}
     */
    teamFields() {
      return pick(TEAM_MODEL_FIELDS, getConfig('admin', 'teamListFields'));
    },

    /**
     * The actions that can be performed against the team entries.
     *
     * @return {Array}
     */
    teamActions() {
      return [
        { name: 'Edit', fn: this.openEditDialog },
        { name: 'Delete', fn: this.openDeleteDialog },
      ];
    },
  },

  methods: {
    ...mapLoadableMethods(
      mapActions('AdminTeams', [
        'getList',
      ]),
    ),

    /**
     * Open the Edit Team dialog.
     *
     * @param {ModelTeam} team - The team to edit.
     */
    openEditDialog(team) {
      this.$refs.teamEditDialog.openDialog(team);
    },

    /**
     * Open the Delete Team dialog.
     *
     * @param {ModelTeam} team - The team to delete.
     * @return {[type]}      [description]
     */
    openDeleteDialog(team) {
      this.$refs.teamDeleteDialog.openDialog(team);
    },
  },
};
</script>

<style scoped>
</style>
