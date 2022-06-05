const { request } = require('#ui/lib/xhr');
const { delayMin } = require('#lib/Time');
const { CreditModel } = require('#features/credit/lib/models/CreditModel');

module.exports = {
  namespaced: true,

  state: {
    /**
     * @type {Array} The current page of the list of credits being viewed.
     */
    currentPage: [],

    /**
     * @type {Number} The total number of pages of credits.
     */
    totalPages: 1,
  },

  mutations: {
    /**
     * Save the list of credits.
     *
     * @param {Object} state - The state to modify.
     * @param {Array<CreditModel>} credits - The credits to save.
     * @param {Number} pages - The total number of pages of credits.
     */
    saveList(state, { credits, pages }) {
      state.currentPage = credits;
      state.totalPages = pages;
    },

    /**
     * Add a credit to the current page of the list.
     *
     * @param {Object} state - The state to modify.
     * @param {CreditModel} credit - The credit to add.
     */
    addCredit(state, { credit }) {
      state.currentPage.push(credit);
    },

    /**
     * Remove a credit from the list.
     *
     * @param {Object} state - The state to modify.
     * @param {Number} id - The ID of the credit to remove.
     */
    removeCredit(state, { id }) {
      state.currentPage = state.currentPage.filter((credit) => credit.id !== id);
    },

    /**
     * Update a credit with new data.
     *
     * @param {Object} state - The state to modify.
     * @param {Number} id - The ID of the credit to update.
     * @param {String} name  - The credit's new name.
     */
    updateCredit(state, { id, name }) {
      state.currentPage = state.currentPage.map((credit) => {
        if (credit.id === id) {
          credit.name = name || credit.name;
        }

        return credit;
      });
    },
  },

  actions: {
    /**
     * Get the list of credits.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {Number} page - Page of list to show.
     * @param {Number} per - The number of entries to show per page.
     * @param {String} search - The text to search for.
     */
    async getList({ commit }, { page = 1, per = 20, search = '' } = {}) {
      const { body: { data, meta } } = await delayMin(
        500,
        request.get('/api/credits').query({ page, per, search }),
      );

      commit('saveList', {
        credits: data.credits.map((credit) => new CreditModel(credit)),
        pages: meta.pages,
      });
    },

    /**
     * Create a new credit.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {String} name - The name of the credit to create.
     */
    async createCredit({ commit }, { name } = {}) {
      const { body: { data } } = await delayMin(
        500,
        request.post('/api/credits').send({ name }),
      );

      commit('addCredit', {
        credit: new CreditModel(data.credit),
      });

      return data;
    },

    /**
     * Delete a credit.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {Number} id - The id of the credit to delete.
     */
    async deleteCredit({ commit }, { id }) {
      await delayMin(
        500,
        request.delete(`/api/credits/${id}`),
      );

      commit('removeCredit', { id });
    },

    /**
     * Update a credit.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {Number} id - The id of the credit to update.
     * @param {String} name - The new name of the credit.
     */
    async updateCredit({ commit }, { id, name }) {
      await delayMin(
        500,
        request.put(`/api/credits/${id}`).send({ name }),
      );

      commit('updateCredit', { id, name });
    },
  },
};
