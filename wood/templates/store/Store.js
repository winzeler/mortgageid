const { request } = require('#ui/lib/xhr');
const { delayMin } = require('#lib/Time');
const { ###_PASCAL_NAME_###Model } = require('#features/###_FEATURE_NAME_###/lib/models/###_PASCAL_NAME_###Model');

module.exports = {
  namespaced: true,

  state: {
    /**
     * @type {Array} The current page of the list of ###_PLURAL_NAME_### being viewed.
     */
    currentPage: [],

    /**
     * @type {Number} The total number of pages of ###_PLURAL_NAME_###.
     */
    totalPages: 1,
  },

  mutations: {
    /**
     * Save the list of ###_PLURAL_NAME_###.
     *
     * @param {Object} state - The state to modify.
     * @param {Array<###_PASCAL_NAME_###Model>} ###_CAMEL_PLURAL_NAME_### - The ###_PLURAL_NAME_### to save.
     * @param {Number} pages - The total number of pages of ###_PLURAL_NAME_###.
     */
    saveList(state, { ###_CAMEL_PLURAL_NAME_###, pages }) {
      state.currentPage = ###_CAMEL_PLURAL_NAME_###;
      state.totalPages = pages;
    },

    /**
     * Add a ###_SINGULAR_NAME_### to the current page of the list.
     *
     * @param {Object} state - The state to modify.
     * @param {###_PASCAL_NAME_###Model} ###_CAMEL_NAME_### - The ###_SINGULAR_NAME_### to add.
     */
    add###_PASCAL_NAME_###(state, { ###_CAMEL_NAME_### }) {
      state.currentPage.push(###_CAMEL_NAME_###);
    },

    /**
     * Remove a ###_SINGULAR_NAME_### from the list.
     *
     * @param {Object} state - The state to modify.
     * @param {Number} id - The ID of the ###_SINGULAR_NAME_### to remove.
     */
    remove###_PASCAL_NAME_###(state, { id }) {
      state.currentPage = state.currentPage.filter((###_CAMEL_NAME_###) => ###_CAMEL_NAME_###.id !== id);
    },

    /**
     * Update a ###_SINGULAR_NAME_### with new data.
     *
     * @param {Object} state - The state to modify.
     * @param {Number} id - The ID of the ###_SINGULAR_NAME_### to update.
     * @param {String} name  - The ###_SINGULAR_NAME_###'s new name.
     */
    update###_PASCAL_NAME_###(state, { id, name }) {
      state.currentPage = state.currentPage.map((###_CAMEL_NAME_###) => {
        if (###_CAMEL_NAME_###.id === id) {
          ###_CAMEL_NAME_###.name = name || ###_CAMEL_NAME_###.name;
        }

        return ###_CAMEL_NAME_###;
      });
    },
  },

  actions: {
    /**
     * Get the list of ###_PLURAL_NAME_###.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {Number} page - Page of list to show.
     * @param {Number} per - The number of entries to show per page.
     * @param {String} search - The text to search for.
     */
    async getList({ commit }, { page = 1, per = 20, search = '' } = {}) {
      const { body: { data, meta } } = await delayMin(
        500,
        request.get('/api/###_KEBAB_PLURAL_NAME_###').query({ page, per, search }),
      );

      commit('saveList', {
        ###_CAMEL_PLURAL_NAME_###: data.###_CAMEL_PLURAL_NAME_###.map((###_CAMEL_NAME_###) => new ###_PASCAL_NAME_###Model(###_CAMEL_NAME_###)),
        pages: meta.pages,
      });
    },

    /**
     * Create a new ###_SINGULAR_NAME_###.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {String} name - The name of the ###_SINGULAR_NAME_### to create.
     */
    async create###_PASCAL_NAME_###({ commit }, { name } = {}) {
      const { body: { data } } = await delayMin(
        500,
        request.post('/api/###_KEBAB_PLURAL_NAME_###').send({ name }),
      );

      commit('add###_PASCAL_NAME_###', {
        ###_CAMEL_NAME_###: new ###_PASCAL_NAME_###Model(data.###_CAMEL_NAME_###),
      });

      return data;
    },

    /**
     * Delete a ###_SINGULAR_NAME_###.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {Number} id - The id of the ###_SINGULAR_NAME_### to delete.
     */
    async delete###_PASCAL_NAME_###({ commit }, { id }) {
      await delayMin(
        500,
        request.delete(`/api/###_KEBAB_PLURAL_NAME_###/${id}`),
      );

      commit('remove###_PASCAL_NAME_###', { id });
    },

    /**
     * Update a ###_SINGULAR_NAME_###.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {Number} id - The id of the ###_SINGULAR_NAME_### to update.
     * @param {String} name - The new name of the ###_SINGULAR_NAME_###.
     */
    async update###_PASCAL_NAME_###({ commit }, { id, name }) {
      await delayMin(
        500,
        request.put(`/api/###_KEBAB_PLURAL_NAME_###/${id}`).send({ name }),
      );

      commit('update###_PASCAL_NAME_###', { id, name });
    },
  },
};
