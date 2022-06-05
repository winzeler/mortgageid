const { request } = require('#ui/lib/xhr');
const { delayMin } = require('#lib/Time');
const { VeridaConnectModel } = require('#features/verida-connect/lib/models/VeridaConnectModel');

module.exports = {
  namespaced: true,

  state: {
    /**
     * @type {Array} The current page of the list of veridaConnects being viewed.
     */
    currentPage: [],

    /**
     * @type {Number} The total number of pages of veridaConnects.
     */
    totalPages: 1,
  },

  mutations: {
    /**
     * Save the list of veridaConnects.
     *
     * @param {Object} state - The state to modify.
     * @param {Array<VeridaConnectModel>} veridaConnects - The veridaConnects to save.
     * @param {Number} pages - The total number of pages of veridaConnects.
     */
    saveList(state, { veridaConnects, pages }) {
      state.currentPage = veridaConnects;
      state.totalPages = pages;
    },

    /**
     * Add a veridaConnect to the current page of the list.
     *
     * @param {Object} state - The state to modify.
     * @param {VeridaConnectModel} veridaConnect - The veridaConnect to add.
     */
    addVeridaConnect(state, { veridaConnect }) {
      state.currentPage.push(veridaConnect);
    },

    /**
     * Remove a veridaConnect from the list.
     *
     * @param {Object} state - The state to modify.
     * @param {Number} id - The ID of the veridaConnect to remove.
     */
    removeVeridaConnect(state, { id }) {
      state.currentPage = state.currentPage.filter((veridaConnect) => veridaConnect.id !== id);
    },

    /**
     * Update a veridaConnect with new data.
     *
     * @param {Object} state - The state to modify.
     * @param {Number} id - The ID of the veridaConnect to update.
     * @param {String} name  - The veridaConnect's new name.
     */
    updateVeridaConnect(state, { id, name }) {
      state.currentPage = state.currentPage.map((veridaConnect) => {
        if (veridaConnect.id === id) {
          veridaConnect.name = name || veridaConnect.name;
        }

        return veridaConnect;
      });
    },
  },

  actions: {
    /**
     * Get the list of veridaConnects.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {Number} page - Page of list to show.
     * @param {Number} per - The number of entries to show per page.
     * @param {String} search - The text to search for.
     */
    async getList({ commit }, { page = 1, per = 20, search = '' } = {}) {
      const { body: { data, meta } } = await delayMin(
        500,
        request.get('/api/verida-connects').query({ page, per, search }),
      );

      commit('saveList', {
        veridaConnects: data.veridaConnects.map((veridaConnect) => new VeridaConnectModel(veridaConnect)), // eslint-disable-line max-len
        pages: meta.pages,
      });
    },

    /**
     * Create a new veridaConnect.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {String} name - The name of the veridaConnect to create.
     */
    async createVeridaConnect({ commit }, { name } = {}) {
      const { body: { data } } = await delayMin(
        500,
        request.post('/api/verida-connects').send({ name }),
      );

      commit('addVeridaConnect', {
        veridaConnect: new VeridaConnectModel(data.veridaConnect),
      });

      return data;
    },

    /**
     * Delete a veridaConnect.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {Number} id - The id of the veridaConnect to delete.
     */
    async deleteVeridaConnect({ commit }, { id }) {
      await delayMin(
        500,
        request.delete(`/api/verida-connects/${id}`),
      );

      commit('removeVeridaConnect', { id });
    },

    /**
     * Update a veridaConnect.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {Number} id - The id of the veridaConnect to update.
     * @param {String} name - The new name of the veridaConnect.
     */
    async updateVeridaConnect({ commit }, { id, name }) {
      await delayMin(
        500,
        request.put(`/api/verida-connects/${id}`).send({ name }),
      );

      commit('updateVeridaConnect', { id, name });
    },
  },
};
