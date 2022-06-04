<template>
  <div class="card">
    <div class="card-header">
      <div class="flex flex-row items-center justify-between ">
        <h2 class="mb-0">
          {{ teamPageHeader }} {{ team.name }}
        </h2>
        <a
          v-if="canManageTeam"
          @click="$refs.renameTeamDialog.openDialog(team.name)"
        >
          Edit Name
        </a>
      </div>
      <div v-if="isFeatureEnabled('subscriptions')">
        Plan:
        <router-link
          v-if="canManageSubscription && subscription"
          to="/subscription"
        >
          {{ subscription.value('fullName') }}
        </router-link>
        <span v-else>
          {{ subscription ? subscription.value('fullName') : 'None' }}
        </span>
      </div>
    </div>
    <div class="card-body">
      <h3>{{ teamPageMembersHeader }}</h3>
      <data-table
        :fields="teamMemberFields"
        :rows="members"
        :is-loading="isLoading"
        :actions-fn="teamMemberActions"
        :show-pagination="false"
        class="w-full"
      />

      <h3
        v-if="invites.length > 0"
        class="mt-4"
      >
        Invites
      </h3>
      <data-table
        v-if="invites.length > 0"
        :fields="teamMemberFields"
        :rows="invites"
        :is-loading="isLoading"
        :actions="teamInviteActions"
        :show-pagination="false"
        class="w-full"
      />

      <div class="flex flex-row-reverse mt-4 items-center">
        <button
          :disabled="isLoading || ! canInvite"
          @click="$refs.inviteMemberDialog.openDialog()"
        >
          {{ teamPageInviteAction }}
        </button>
        <div class="mr-4">
          {{ teamMembersCountText }}
        </div>
      </div>
    </div>

    <invite-member-dialog ref="inviteMemberDialog" />
    <rename-team-dialog ref="renameTeamDialog" />
    <change-role-dialog ref="changeRoleDialog" />
    <remove-member-dialog ref="removeMemberDialog" />
    <cancel-invite-dialog ref="cancelInviteDialog" />
  </div>
</template>

<script>
import { mapLoadableMethods } from 'vue-is-loading';
import { mapActions, mapState } from 'vuex';
import { getErrorMessage } from '#lib/Errors';
import { successToast, errorToast } from '#ui/lib/toast';
import { getLanguageString, isFeatureEnabled } from '#lib/Config';
import { TEAM_MEMBER_MODEL_FIELDS } from '#features/teams/lib/models/TeamMemberModel';
import InviteMemberDialog from '#features/teams/ui/dialogs/InviteMemberDialog';
import RenameTeamDialog from '#features/teams/ui/dialogs/RenameTeamDialog';
import ChangeRoleDialog from '#features/teams/ui/dialogs/ChangeRoleDialog';
import RemoveMemberDialog from '#features/teams/ui/dialogs/RemoveMemberDialog';
import CancelInviteDialog from '#features/teams/ui/dialogs/CancelInviteDialog';
import DataTable from '#ui/components/DataTable';

export default {
  name: 'TeamPage',

  components: {
    DataTable,
    InviteMemberDialog,
    RenameTeamDialog,
    ChangeRoleDialog,
    RemoveMemberDialog,
    CancelInviteDialog,
  },

  computed: {
    teamPageHeader: () => getLanguageString('teams', 'teamPageHeader'),
    teamPageMembersHeader: () => getLanguageString('teams', 'teamPageMembersHeader'),
    teamPageInviteAction: () => getLanguageString('teams', 'teamPageInviteAction'),
    teamPageMembersCountLabel: () => getLanguageString('teams', 'teamPageMembersCountLabel'),
    teamPageRemoveMemberLabel: () => getLanguageString('teams', 'teamPageRemoveMemberLabel'),

    ...mapState('ActiveUser', [
      'team',
      'user',
      'role',
      'subscription',
    ]),

    ...mapState('TeamMembers', [
      'invites',
      'members',
      'limit',
    ]),

    /**
     * If any of the fields we require to display the projects list are loading.
     *
     * @return {Boolean}
     */
    isLoading() {
      return this.$isLoading('getList');
    },

    /**
     * The total number of members plus outstanding invites for this team.
     *
     * @return {Number}
     */
    totalMembers() {
      return this.invites.length + this.members.length;
    },

    /**
     * The fields to display in the list.
     *
     * @return {Array<FieldDisplay>}
     */
    teamMemberFields() {
      return TEAM_MEMBER_MODEL_FIELDS;
    },

    /**
     * If there is still room left in the team member limit to invite members.
     *
     * @return {Boolean}
     */
    canInvite() {
      return this.limit === null ? true : (this.totalMembers < this.limit);
    },

    /**
     * The text indicating the total team members and the limit, if any.
     *
     * @return {String}
     */
    teamMembersCountText() {
      const limitText = this.limit ? ` / ${this.limit}` : '';

      return `${this.teamPageMembersCountLabel} ${this.totalMembers}${limitText}`;
    },

    /**
     * If the current user can manage teams.
     *
     * @return {Boolean}
     */
    canManageTeam() {
      return this.role.hasPermissions(['manage_team']);
    },

    /**
     * If the current user can manage subscriptions.
     *
     * @return {Boolean}
     */
    canManageSubscription() {
      return this.role.hasPermissions(['manage_subscription']);
    },

    /**
     * Returns the function to load team member actions, if the current user can manage teams.
     *
     * @return {Function|null}
     */
    teamMemberActions() {
      return this.canManageTeam ? this.getTeamMemberActions : null;
    },

    /**
     * Returns the function to load team invite actions, if the current user can manage teams.
     *
     * @return {Function|null}
     */
    teamInviteActions() {
      return [
        { name: 'Send Again', fn: this.sendAgain },
        { name: 'Cancel Invite', fn: this.openCancelInviteDialog },
      ];
    },
  },

  mounted: async function mounted() {
    await this.getMembers();
  },

  methods: {
    ...mapLoadableMethods(
      mapActions('TeamMembers', [
        'getList',
        'resendInvite',
      ]),
    ),

    isFeatureEnabled,

    /**
     * Load a page of teams, based on current settings.
     */
    async getMembers() {
      try {
        await this.getList();
      }
      catch (error) {
        errorToast(getErrorMessage(error));
      }
    },

    /**
     * Open the Change Role dialog.
     *
     * @param {ModelTeamMember} member - The team member to change the role for.
     */
    openChangeRoleDialog(member) {
      this.$refs.changeRoleDialog.openDialog(member);
    },

    /**
     * Open the Remove Member dialog.
     *
     * @param {ModelTeamMember} member - The team member to remove.
     */
    openRemoveMemberDialog(member) {
      this.$refs.removeMemberDialog.openDialog(member);
    },

    /**
     * Open the Cancel Invite dialog.
     *
     * @param {ModelTeamMember} member - The team member to remove.
     */
    openCancelInviteDialog(member) {
      this.$refs.cancelInviteDialog.openDialog(member);
    },

    /**
     * The actions that can be performed against the team member entries.
     *
     * No actions can be performed against the current user.
     *
     * @param {TeamMemberModel} member - The team member to get actions for.
     *
     * @return {Array}
     */
    getTeamMemberActions(member) {
      if (member.email !== this.user.email) {
        return [
          { name: 'Change Role', fn: this.openChangeRoleDialog },
          { name: this.teamPageRemoveMemberLabel, fn: this.openRemoveMemberDialog },
        ];
      }

      return null;
    },

    /**
     * Send the invite again.
     *
     * @param {TeamInviteModel} invite - The invite to re-send.
     */
    async sendAgain(invite) {
      try {
        await this.resendInvite({
          name: invite.name,
          email: invite.email,
          role: invite.role.id,
        });
        successToast('Invite re-sent.');
      }
      catch (error) {
        errorToast(getErrorMessage(error, 'Could not re-send invite.'));
      }
    },
  },
};
</script>

<style scoped>
</style>
