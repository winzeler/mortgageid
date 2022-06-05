const moment = require('moment');
const { warningToast } = require('#ui/lib/toast');
const { request } = require('#ui/lib/xhr');
const { delayMin } = require('#lib/Time');
const { getConfig, isFeatureEnabled } = require('#lib/Config');
const { UserDashboardModel } = require('#features/admin/lib/models/UserDashboardModel');
const { TeamDashboardModel } = require('#features/admin/lib/models/TeamDashboardModel');

module.exports = {
  namespaced: true,

  state: {
    /**
     * @type {Object} The dashboard data model.
     */
    dashboardData: null,
  },

  mutations: {
    /**
     * Save the dashboard data.
     *
     * @param {Object} state - The state to modify.
     * @param {Object} dashboardData - The dashboard data model.
     */
    saveData(state, { dashboardData }) {
      state.dashboardData = dashboardData;
    },
  },

  actions: {
    /**
     * Gets dashboard data
     *
     * @param {Function} commit - Function used to call mutation.
     */
    async getData({ commit }) {
      const { body: { data } } = await delayMin(
        500,
        request.get('/api/admin/dashboard'),
      );

      const dashboardData = isFeatureEnabled('teams')
        ? new TeamDashboardModel(data)
        : new UserDashboardModel(data);

      // Don't display warnings if showing dashboard demo data
      if (! getConfig('admin', 'displayDashboardDemoData')) {
        // Show warning if no rollup data generated yet
        const today = moment().startOf('day');
        if (dashboardData.day.isAfter(today)) {
          warningToast('No rollup data.  Run DashboardRollupScript.');
        }

        // Show warning if rollup data is too old
        const yesterday = moment.utc().subtract(1, 'day').startOf('day');
        if (dashboardData.day.isBefore(yesterday)) {
          warningToast(`Old rollup data (${dashboardData.value('day')})`);
        }
      }

      commit('saveData', { dashboardData });
    },
  },
};
