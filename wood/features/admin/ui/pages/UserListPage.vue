<template>
  <div class="card w-full mx-auto">
    <h2 class="card-header">
      Users
    </h2>
    <div class="card-body">
      <data-table
        :fields="userFields"
        :rows="currentPage"
        :total-pages="totalPages"
        :load-list="getList"
        :is-loading="$isLoading('getList')"
        :search-enabled="true"
        :search-label="'Search (Name/Email)'"
        :actions-fn="userActions"
        class="w-full"
      />
    </div>

    <user-edit-dialog ref="userEditDialog" />
    <user-reset-password-dialog ref="userResetPasswordDialog" />
    <user-resend-confirmation-dialog ref="userResendConfirmationDialog" />
    <user-delete-dialog ref="userDeleteDialog" />
  </div>
</template>

<script>
import { mapLoadableMethods } from 'vue-is-loading';
import { mapActions, mapState } from 'vuex';
import pick from 'lodash/pick';
import { USER_MODEL_FIELDS } from '#features/users/lib/models/UserModel';
import UserEditDialog from '#features/admin/ui/dialogs/UserEditDialog';
import UserResetPasswordDialog from '#features/admin/ui/dialogs/UserResetPasswordDialog';
import UserResendConfirmationDialog from '#features/admin/ui/dialogs/UserResendConfirmationDialog'; // eslint-disable-line max-len
import UserDeleteDialog from '#features/admin/ui/dialogs/UserDeleteDialog';
import { getConfig } from '#lib/Config';
import DataTable from '#ui/components/DataTable';

export default {
  name: 'UserListPage',

  components: {
    UserEditDialog,
    UserResetPasswordDialog,
    UserResendConfirmationDialog,
    UserDeleteDialog,
    DataTable,
  },

  computed: {
    ...mapState('AdminUsers', [
      'currentPage',
      'totalPages',
    ]),

    ...mapState('ActiveUser', [
      'user',
    ]),

    /**
     * The fields to display in the user list.
     *
     * @return {Array<FieldDisplay>}
     */
    userFields() {
      return pick(USER_MODEL_FIELDS, getConfig('admin', 'userListFields'));
    },
  },

  methods: {
    ...mapLoadableMethods(
      mapActions('AdminUsers', [
        'getList',
      ]),
    ),

    /**
     * Opens the user edit dialog.
     *
     * @param {UserModel} user - The user to open the dialog for.
     */
    openUserEditDialog(user) {
      this.$refs.userEditDialog.openDialog(user);
    },

    /**
     * Opens the reset user password dialog.
     *
     * @param {UserModel} user - The user to open the dialog for.
     */
    openUserResetPasswordDialog(user) {
      this.$refs.userResetPasswordDialog.openDialog(user);
    },

    /**
     * Opens the user resend confirmation dialog.
     *
     * @param {UserModel} user - The user to open the dialog for.
     */
    openUserResendConfirmationDialog(user) {
      this.$refs.userResendConfirmationDialog.openDialog(user);
    },

    /**
     * Opens the user delete dialog.
     *
     * @param {UserModel} user - The user to open the dialog for.
     */
    openUserDeleteDialog(user) {
      this.$refs.userDeleteDialog.openDialog(user);
    },

    /**
     * The actions that can be performed against the user entries.
     *
     * No actions can be performed against the current user.
     *
     * @param {UserModel} user - The user to get actions for.
     *
     * @return {Array}
     */
    userActions(user) {
      if (user.email !== this.user.email) {
        const actions = [
          { name: 'Edit', fn: this.openUserEditDialog },
          { name: 'Reset Password', fn: this.openUserResetPasswordDialog },
        ];

        if (! user.emailConfirmed) {
          actions.push({
            name: 'Resend Confirmation Email',
            fn: this.openUserResendConfirmationDialog,
          });
        }

        actions.push({ name: 'Delete', fn: this.openUserDeleteDialog });

        return actions;
      }

      return null;
    },
  },
};
</script>
