const { request } = require('#ui/lib/xhr');
const { delayMin } = require('#lib/Time');
const { VconnectModel } = require('#features/vconnect/lib/models/VconnectModel');

module.exports = {
  namespaced: true,

  state: {
    /**
     * @type {Array} The current page of the list of vconnects being viewed.
     */
    currentPage: [],

    /**
     * @type {Number} The total number of pages of vconnects.
     */
    totalPages: 1,

    context: {},
  },

  mutations: {
    /**
     * Save the list of vconnects.
     *
     * @param {Object} state - The state to modify.
     * @param {Array<VconnectModel>} vconnects - The vconnects to save.
     * @param {Number} pages - The total number of pages of vconnects.
     */
    saveList(state, { vconnects, pages }) {
      state.currentPage = vconnects;
      state.totalPages = pages;
    },

    /**
     * Add a vconnect to the current page of the list.
     *
     * @param {Object} state - The state to modify.
     * @param {VconnectModel} vconnect - The vconnect to add.
     */
    addVconnect(state, { vconnect }) {
      state.currentPage.push(vconnect);
    },

    /**
     * Remove a vconnect from the list.
     *
     * @param {Object} state - The state to modify.
     * @param {Number} id - The ID of the vconnect to remove.
     */
    removeVconnect(state, { id }) {
      state.currentPage = state.currentPage.filter((vconnect) => vconnect.id !== id);
    },

    /**
     * Update a vconnect with new data.
     *
     * @param {Object} state - The state to modify.
     * @param {Number} id - The ID of the vconnect to update.
     * @param {String} name  - The vconnect's new name.
     */
    updateVconnect(state, { id, name }) {
      state.currentPage = state.currentPage.map((vconnect) => {
        if (vconnect.id === id) {
          vconnect.name = name || vconnect.name;
        }

        return vconnect;
      });
    },
    /**
     * Update a vconnect with new data.
     *
     * @param {Object} state - state.
     * @param {Object} payload - payload.
     */
    setContext(state, payload) {
      state.context = payload;
    },
  },

  actions: {
    /**
     * Get the list of vconnects.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {Number} page - Page of list to show.
     * @param {Number} per - The number of entries to show per page.
     * @param {String} search - The text to search for.
     */
    async getList({ commit }, { page = 1, per = 20, search = '' } = {}) {
      const { body: { data, meta } } = await delayMin(
        500,
        request.get('/api/vconnects').query({ page, per, search }),
      );

      commit('saveList', {
        vconnects: data.vconnects.map((vconnect) => new VconnectModel(vconnect)),
        pages: meta.pages,
      });
    },

    /**
     * Create a new vconnect.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {String} name - The name of the vconnect to create.
     */
    async createVconnect({ commit }, { name } = {}) {
      const { body: { data } } = await delayMin(
        500,
        request.post('/api/vconnects').send({ name }),
      );

      commit('addVconnect', {
        vconnect: new VconnectModel(data.vconnect),
      });

      return data;
    },

    /**
     * Delete a vconnect.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {Number} id - The id of the vconnect to delete.
     */
    async deleteVconnect({ commit }, { id }) {
      await delayMin(
        500,
        request.delete(`/api/vconnects/${id}`),
      );

      commit('removeVconnect', { id });
    },

    /**
     * Update a vconnect.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {Number} id - The id of the vconnect to update.
     * @param {String} name - The new name of the vconnect.
     */
    async updateVconnect({ commit }, { id, name }) {
      await delayMin(
        500,
        request.put(`/api/vconnects/${id}`).send({ name }),
      );

      commit('updateVconnect', { id, name });
    },
  },
};
