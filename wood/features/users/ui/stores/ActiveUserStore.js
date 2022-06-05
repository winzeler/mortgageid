const { request, updateCsrfToken } = require('#ui/lib/xhr');
const { delayMin } = require('#lib/Time');
const { UserModel } = require('#features/users/lib/models/UserModel');
const { SubscriptionModel } = require('#features/subscriptions/lib/models/SubscriptionModel');
const { TeamModel } = require('#features/teams/lib/models/TeamModel');
const { RoleModel } = require('#features/teams/lib/models/RoleModel');

module.exports = {
  namespaced: true,

  state: {
    /**
     * @type {UserModel} The active user of the app.
     */
    user: null,

    /**
     * @type {SubscriptionModel} The subscription for the active user of the app.
     */
    subscription: null,

    /**
     * @type {TeamModel} The team for the active user of the app.
     */
    team: null,

    /**
     * @type {RoleModel} The role for the active user of the app.
     */
    role: null,
  },

  mutations: {
    /**
     * Save the active user's properties.
     *
     * @param {Object} state - The state to modify.
     * @param {UserModel} user - The user to save.
     * @param {SubscriptionModel} subscription - The subscription to save.
     * @param {TeamModel} team - The team to save.
     * @param {RoleModel} role - The role to save.
     */
    saveActive(state, { user, subscription, team, role }) {
      state.user = user || state.user;
      state.subscription = subscription || state.subscription;
      state.team = team || state.team;
      state.role = role || state.role;
    },

    /**
     * Update the active user with new values.
     *
     * @param {Object} state - The state to modify.
     * @param {String} name - The name to update
     */
    updateUser(state, { name }) {
      state.user.name = name;
    },

    /**
     * Clear the active user's subscription.
     *
     * @param {Object} state - The state to modify.
     */
    clearSubscription(state) {
      state.subscription = null;
    },
  },

  actions: {
    /**
     * Sign up to the app.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {String} email - The email of the user being created.
     * @param {String} name - The name of the user being created.
     * @param {String} team_name - (Optional) The name of the team being created.
     * @param {String} password - The password of the user being created.
     * @param {String} password_repeat - The password of the user being created.
     */
    async signup({ commit }, { email, name, team_name, password, password_repeat }) {
      await delayMin(
        500,
        request.post('/api/public/signup').send(
          { email, name, team_name, password, password_repeat },
        ),
      );

      updateCsrfToken();
    },

    /**
     * Log in to the app.  Force a reload of the active user, in case of switching users.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {String} email - The email of the user logging in.
     * @param {String} password - The password of the user logging in.
     */
    async login({ commit, dispatch }, { email, password }) {
      await request.post('/api/public/login').send({ email, password });

      updateCsrfToken();

      await dispatch('getActive', { force: true });
    },

    /**
     * Email a password reset token to a user.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {String} email - The email of the user resetting their password.
     */
    async resetPassword({ commit }, { email }) {
      await delayMin(
        500,
        request.post('/api/public/reset-password').send({ email }),
      );
    },

    /**
     * With a valid password reset token, change a user's password.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {String} token - The token for the user changing their password.
     * @param {String} password - The password to change to.
     * @param {String} password_repeat - The password to change to.
     */
    async changePassword({ commit }, { token, password, password_repeat }) {
      await delayMin(
        500,
        request.post('/api/public/change-password').send({ token, password, password_repeat }),
      );
    },

    /**
     * With a valid creation token, confirm a user's email address.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {String} token - The token for the user confirming their email.
     */
    async confirmEmail({ commit }, { token }) {
      await delayMin(
        500,
        request.post('/api/public/confirm-email').send({ token }),
      );
    },

    /**
     * Log out of the app.
     */
    async logout() {
      await request.post('/api/public/logout');
    },

    /**
     * Get the currently-logged in user's details and store in cache, unless cached.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {Object} state - The current state.
     * @param {Boolean} force - If forced, ignore cache.
     */
    async getActive({ commit, state }, { force = false } = {}) {
      // If forced or no active user
      if (force || ! state.user) {
        const { body: { data: { user, subscription, team, role } } } = await request.get('/api/users/me');

        commit('saveActive', {
          user: new UserModel(user),
          subscription: subscription ? new SubscriptionModel(subscription) : null,
          team: team ? new TeamModel(team) : null,
          role: role ? new RoleModel(role) : null,
        });
      }
    },

    /**
     * Email an email confirmation email to a user.
     *
     * @param {Function} commit - Function used to call mutation.
     */
    async sendConfirmEmail({ commit }) {
      await delayMin(
        500,
        request.post('/api/users/resend-confirmation'),
      );
    },

    /**
     * Save changes to the user.
     *
     * @param {Function} commit - Function used to call mutation.
     * @param {Number} id - The ID of the user to save.
     * @param {String} name - The name of the user.
     * @param {String} password - The user's new password.
     * @param {String} password_repeate - The user's password, repeated.
     */
    async updateUser({ commit }, { name, password, password_repeat }) {
      await delayMin(
        500,
        request.put('/api/users').send({ name, password, password_repeat }),
      );

      commit('updateUser', { name });
    },

    /**
     * Send a customer support request.
     *
     * @param {Object} context - Vuex context.  Unused.
     * @param {String} message - The message containing the support request.
     */
    async sendSupportRequest(context, { message }) {
      await delayMin(
        500,
        request.post('/api/users/support').send({ message }),
      );
    },
  },
};
