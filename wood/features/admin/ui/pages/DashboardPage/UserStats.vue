<template>
  <div class="card">
    <h2 class="card-header">
      Analytics
    </h2>
    <div class="card-body flex flex-col sm:flex-row space-y-4 sm:space-y-0 justify-around">
      <dashboard-stat-large
        icon="fa-users"
        icon-color="text-blue-700"
        label="Total Users"
        :value="usersTotal"
      />
      <dashboard-stat-large
        icon="fa-user-plus"
        icon-color="text-purple-600"
        :label="`New Users (${month})`"
        :value="usersNew"
      />
      <template v-if="hasMrrData">
        <dashboard-stat-large
          icon="fa-money-bill"
          icon-color="text-themeMoney-500"
          label="MRR"
          value-class="text-3xl font-bold"
          :value="mrrTotal"
        />
        <dashboard-stat-large
          icon="fa-money-bill-wave"
          icon-color="text-teal-500"
          :label="`New MRR (${month})`"
          :value="mrrNew"
          value-class="text-3xl font-bold"
        />
      </template>
    </div>
  </div>
</template>

<script>
import moment from 'moment';
import { mapState } from 'vuex';
import DashboardStatLarge from '#ui/components/DashboardStatLarge';

export default {
  name: 'UserStats',

  components: {
    DashboardStatLarge,
  },

  computed: {
    ...mapState('AdminDashboard', [
      'dashboardData',
    ]),

    month() {
      return moment().format('MMM');
    },

    /**
     * Returns the total number of users for this app.
     *
     * @return {String}
     */
    usersTotal() {
      return this.dashboardData ? this.dashboardData.value('usersTotal') : '';
    },

    /**
     * Returns the new number of users for this month for this app.
     *
     * @return {String}
     */
    usersNew() {
      return this.dashboardData ? `+${this.dashboardData.value('usersNew')}` : '';
    },

    /**
     * Indicates if MRR data is included in the dashboard data.
     *
     * @return {Boolean}
     */
    hasMrrData() {
      return this.dashboardData ? this.dashboardData.hasMrrData() : false;
    },

    /**
     * Returns the total MRR for this app.
     *
     * @return {String}
     */
    mrrTotal() {
      return this.dashboardData ? this.dashboardData.value('mrrTotal') : '';
    },

    /**
     * Returns the new MRR this month for this app.
     *
     * @return {String}
     */
    mrrNew() {
      return this.dashboardData ? `+${this.dashboardData.value('mrrNew')}` : '';
    },
  },
};
</script>

<style scoped>
</style>
