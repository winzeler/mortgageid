const { request, updateCsrfToken } = require('#ui/lib/xhr');
const { delayMin } = require('#lib/Time');
const { TeamInviteModel } = require('#features/teams/lib/models/TeamInviteModel');

module.exports = {
  namespaced: true,

  state: {
    /**
     * @type {TeamInviteModel} The invite being accepted.
     */
    invite: {},

    /**
     * @type {String} The name of the team being joined.
     */
    teamName: '',

    /**
     * @type {Boolean} If the user joining the team already exists.
     */
    userExists: false,
  },

  mutations: {
    /**
     * Save the invite information
     *
     * @param {Object} state - The state to modify.
     * @param {TeamInviteModel} invite - The invite being accepted.
     * @param {String} team_name - The name of the team being joined.
     * @param {Boolean} user_exists - If the user joining the team already exists.
     */
    saveInviteInformation(state, { invite, team_name, user_exists }) {
      state.invite = invite;
      state.teamName = team_name;
      state.userExists = user_exists;
    },
  },

  actions: {
    /**
     * Get the invite information.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {String} token - The token used to load the invite information.
     */
    async getInvite({ commit }, { token }) {
      const { body: { data } } = await delayMin(
        500,
        request.get(`/api/public/team/invites/${token}`),
      );

      commit('saveInviteInformation', {
        ...data,
        invite: new TeamInviteModel(data.invite),
      });
    },

    /**
     * Invite a new team member to the team.
     *
     * @param {Object} state - The state of this invite.
     * @param {Function} commit - Function used to call mutation.
     * @param {String} token - The token identifying the invitation.
     * @param {String} name - The name of the team member being invited.
     * @param {String} password - The password of the team member being invited.
     * @param {String} password_repeat - The password, repeated.
     */
    async acceptInvite({ state, commit }, { token, name, password, password_repeat } = {}) {
      await delayMin(
        500,
        request.post(`/api/public/team/invites/${token}`).send(
          state.userExists ? { password } : { name, password, password_repeat },
        ),
      );

      updateCsrfToken();
    },
  },
};
