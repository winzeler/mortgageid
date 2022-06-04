const { request } = require('#ui/lib/xhr');
const { delayMin } = require('#lib/Time');
const { UserModel } = require('#features/users/lib/models/UserModel');

module.exports = {
  namespaced: true,

  state: {
    /**
     * @type {Array} The current page of the list of users being viewed.
     */
    currentPage: [],

    /**
     * @type {Number} The total number of pages of users.
     */
    totalPages: 1,
  },

  mutations: {
    /**
     * Save the current page of users being viewed.
     *
     * @param {Object} state - The state to modify.
     * @param {Array<UserModel>} users - The users to save.
     * @param {Number} pages - The total number of pages of users.
     */
    saveList(state, { users, pages }) {
      state.currentPage = users;
      state.totalPages = pages;
    },

    /**
     * Update a user in the current page with new values.
     *
     * @param {Object} state - The state to modify.
     * @param {Number} id - The ID of the user to update.
     * @param {String} name - The name to update.
     * @param {String} account_type - The account type to update.
     */
    updateUserInPage(state, { id, name, account_type }) {
      state.currentPage = state.currentPage.map((user) => {
        if (user.id === id) {
          user.name = name;
          user.accountType = account_type;
        }

        return user;
      });
    },

    /**
     * Remove a user from the current page of users being viewed.
     *
     * @param {Object} state - The state to modify.
     * @param {Number} id - The ID of the user to remove.
     */
    removeUserFromPage(state, { id }) {
      state.currentPage = state.currentPage.filter((user) => user.id !== id);
    },
  },

  actions: {
    /**
     * Get a list of users.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {Number} page - Page of list to show.
     * @param {Number} per - The number of entries to show per page.
     * @param {String} search - The text to search for.
     */
    async getList({ commit }, { page = 1, per = 20, search = '' } = {}) {
      const { body: { data, meta } } = await delayMin(
        500,
        request.get('/api/admin/users').query({ page, per, search }),
      );

      commit('saveList', {
        users: data.users.map((user) => new UserModel(user)),
        pages: meta.pages,
      });
    },

    /**
     * Save changes to the user from the admin interface.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {Number} id - The ID of the user to save.
     * @param {String} name - The name of the user.
     * @param {String} account_type - The account type of the user.
     */
    async saveUser({ commit }, { id, name, account_type }) {
      await delayMin(
        500,
        request.put(`/api/admin/users/${id}`).send({ name, account_type }),
      );

      commit('updateUserInPage', { id, name, account_type });
    },

    /**
     * Send a password reset email for a user.
     *
     * @param {Object} context - Unused.
     * @param {Number} id - The ID of the user to send the email to.
     */
    async resetUserPassword(context, { id }) {
      await delayMin(
        500,
        request.post(`/api/admin/users/${id}/reset-password`),
      );
    },

    /**
     * Send an email confirmation email to the user.
     *
     * @param {Object} context - Unused.
     * @param {Number} id - The ID of the user to send the email to.
     */
    async resendUserEmailConfirmation(context, { id }) {
      await delayMin(
        500,
        request.post(`/api/admin/users/${id}/resend-confirmation`),
      );
    },

    /**
     * Delete a user.
     *
     * @param {Object} context - Unused.
     * @param {Number} id - The ID of the user to delete.
     */
    async deleteUser({ commit }, { id }) {
      await delayMin(
        500,
        request.delete(`/api/admin/users/${id}`),
      );

      commit('removeUserFromPage', { id });
    },
  },
};
