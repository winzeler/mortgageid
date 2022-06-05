const { request } = require('#ui/lib/xhr');
const { delayMin } = require('#lib/Time');
const { TeamMemberModel } = require('#features/teams/lib/models/TeamMemberModel');
const { TeamInviteModel } = require('#features/teams/lib/models/TeamInviteModel');
const { RoleModel } = require('#features/teams/lib/models/RoleModel');

module.exports = {
  namespaced: true,

  state: {
    /**
     * @type {Array} A list of team member invites.
     */
    invites: [],

    /**
     * @type {Array} The current page of the list of team members being viewed.
     */
    members: [],

    /**
     * @type {Number} The maximum number of team members + invites this team is allowed to have,
     * based on their subscription.
     */
    limit: null,
  },

  mutations: {
    /**
     * Save the list of team members.
     *
     * @param {Object} state - The state to modify.
     * @param {Array<TeamMemberModel>} members - The members to save.
     * @param {Array<TeamInviteModel>} invites - The invites to save.
     * @param {Number} limit - The limit to save.
     */
    saveList(state, { members, invites, limit }) {
      state.members = members;
      state.invites = invites;
      state.limit = limit;
    },

    /**
     * Add a team member to the current list.
     *
     * @param {Object} state - The state to modify.
     * @param {TeamIMemberModel} member - The team member to add.
     */
    addMember(state, { member }) {
      state.members.push(member);
    },

    /**
     * Add a team member invitation to the current list.
     *
     * @param {Object} state - The state to modify.
     * @param {TeamInviteModel} member - The team member to add.
     */
    addInvite(state, { invite }) {
      state.invites.push(invite);
    },

    /**
     * Remove a team member from the list.
     *
     * @param {Object} state - The state to modify.
     * @param {Number} id - The ID of the team member to remove.
     */
    removeMember(state, { id }) {
      state.members = state.members.filter((member) => member.id !== id);
    },

    /**
     * Remove an invite member from the list.
     *
     * @param {Object} state - The state to modify.
     * @param {String} email - The email of the invite to remove.
     */
    removeInvite(state, { email }) {
      state.invites = state.invites.filter((invite) => invite.email !== email);
    },

    /**
     * Update a team member with new data.
     *
     * @param {Object} state - The state to modify.
     * @param {Number} id - The ID of the team member to update.
     * @param {String} role  - The team's new role.
     */
    updateMember(state, { id, role }) {
      state.members = state.members.map((member) => {
        if (member.id === id) {
          member.role = role || member.role;
        }

        return member;
      });
    },
  },

  actions: {
    /**
     * Get the list of team members.
     *
     * @param {Function} commit - Function used to call mutation.
     */
    async getList({ commit }) {
      const { body: { data } } = await delayMin(
        500,
        request.get('/api/team/members'),
      );

      commit('saveList', {
        members: data.members.map((member) => new TeamMemberModel(member)),
        invites: data.invites.map((invite) => new TeamInviteModel(invite)),
        limit: data.limit,
      });
    },

    /**
     * Invite a new team member to the team.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {String} name - The name of the team member to invite.
     * @param {String} email - The email of the team member to invite.
     * @param {String} role - The role of the team member to invite.
     */
    async inviteMember({ commit }, { name, email, role } = {}) {
      const { body: { data } } = await delayMin(
        500,
        request.post('/api/team/invites').send({ name, email, role }),
      );

      commit('addInvite', {
        invite: new TeamInviteModel(data.invite),
      });

      return data;
    },

    /**
     * Re-send a team member invite.
     *
     * @param {Object} context - Unused.
     * @param {String} name - The name of the team member to invite.
     * @param {String} email - The email of the team member to invite.
     * @param {String} role - The role of the team member to invite.
     */
    async resendInvite(context, { name, email, role } = {}) {
      await delayMin(
        500,
        request.post('/api/team/invites').send({ name, email, role }),
      );
    },

    /**
     * Cancel an invite.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {String} email - The email of the team member to cancel the invitation for.
     */
    async cancelInvite({ commit }, { email } = {}) {
      await delayMin(
        500,
        request.delete(`/api/team/invites/${email}`),
      );

      commit('removeInvite', { email });
    },

    /**
     * Delete a team member.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {Number} id - The id of the team member to delete.
     */
    async deleteMember({ commit }, { id }) {
      await delayMin(
        500,
        request.delete(`/api/team/members/${id}`),
      );

      commit('removeMember', { id });
    },

    /**
     * Update a team member.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {Number} id - The id of the team member to update.
     * @param {String} role - The new role of the team member.
     */
    async updateMember({ commit }, { id, role }) {
      await delayMin(
        500,
        request.put(`/api/team/members/${id}`).send({ role }),
      );

      commit('updateMember', { id, role: new RoleModel({ id: role }) });
    },

    /**
     * Remove a team member from your team.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {Number} id - The id of the team member to remove.
     */
    async removeMember({ commit }, { id }) {
      await delayMin(
        500,
        request.delete(`/api/team/members/${id}`),
      );

      commit('removeMember', { id });
    },
  },
};
