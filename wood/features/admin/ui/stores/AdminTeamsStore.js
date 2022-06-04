const { request } = require('#ui/lib/xhr');
const { delayMin } = require('#lib/Time');
const { TeamModel } = require('#features/teams/lib/models/TeamModel');

module.exports = {
  namespaced: true,

  state: {
    /**
     * @type {Array} The current page of the list of teams being viewed.
     */
    currentPage: [],

    /**
     * @type {Number} The total number of pages of teams.
     */
    totalPages: 1,
  },

  mutations: {
    /**
     * Save the current page of teams being viewed.
     *
     * @param {Object} state - The state to modify.
     * @param {Array<TeamModel>} teams - The teams to save.
     * @param {Number} pages - The total number of pages of teams.
     */
    saveList(state, { teams, pages }) {
      state.currentPage = teams;
      state.totalPages = pages;
    },

    /**
     * Update a team in the current page with new values.
     *
     * @param {Object} state - The state to modify.
     * @param {Number} id - The ID of the team to update.
     * @param {String} name - The name to update.
     */
    updateTeamInPage(state, { id, name }) {
      state.currentPage = state.currentPage.map((team) => {
        if (team.id === id) {
          team.name = name;
        }

        return team;
      });
    },

    /**
     * Remove a team from the current page of teams being viewed.
     *
     * @param {Object} state - The state to modify.
     * @param {Number} id - The ID of the team to remove.
     */
    removeTeamFromPage(state, { id }) {
      state.currentPage = state.currentPage.filter((team) => team.id !== id);
    },
  },

  actions: {
    /**
     * Get a list of teams.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {Number} page - Page of list to show.
     * @param {Number} per - The number of entries to show per page.
     * @param {String} search - The text to search for.
     */
    async getList({ commit }, { page = 1, per = 20, search = '' } = {}) {
      const { body: { data, meta } } = await delayMin(
        500,
        request.get('/api/admin/teams').query({ page, per, search }),
      );

      commit('saveList', {
        teams: data.teams.map((team) => new TeamModel(team)),
        pages: meta.pages,
      });
    },

    /**
     * Save changes to the team from the admin interface.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {Number} id - The ID of the team to save.
     * @param {String} name - The name of the team.
     */
    async saveTeam({ commit }, { id, name }) {
      await delayMin(
        500,
        request.put(`/api/admin/teams/${id}`).send({ name }),
      );

      commit('updateTeamInPage', { id, name });
    },

    /**
     * Delete a team.
     *
     * @param {Object} context - Unused.
     * @param {Number} id - The ID of the team to delete.
     */
    async deleteTeam({ commit }, { id }) {
      await delayMin(
        500,
        request.delete(`/api/admin/teams/${id}`),
      );

      commit('removeTeamFromPage', { id });
    },
  },
};
