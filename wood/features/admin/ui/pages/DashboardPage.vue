<template>
  <loading-spinner v-if="$isLoading('getData')" />

  <div
    v-else
    class="flex flex-wrap"
  >
    <template v-if="isTeamsEnabled">
      <team-stats class="w-full m-4" />
      <recent-teams class="flex-grow m-4" />
    </template>
    <template v-else>
      <user-stats class="w-full m-4" />
      <recent-users class="flex-grow m-4" />
    </template>
    <days-chart
      class="flex-grow m-4"
      :days="dashboardDays"
    />
  </div>
</template>

<script>
import { mapLoadableMethods } from 'vue-is-loading';
import { mapActions, mapState } from 'vuex';
import get from 'lodash/get';
import LoadingSpinner from '#ui/components/LoadingSpinner';
import UserStats from '#features/admin/ui/pages/DashboardPage/UserStats';
import RecentUsers from '#features/admin/ui/pages/DashboardPage/RecentUsers';
import TeamStats from '#features/admin/ui/pages/DashboardPage/TeamStats';
import RecentTeams from '#features/admin/ui/pages/DashboardPage/RecentTeams';
import DaysChart from '#features/admin/ui/pages/DashboardPage/DaysChart';
import { getConfig, isFeatureEnabled } from '#lib/Config';
import { infoToast } from '#ui/lib/toast';

export default {
  name: 'DashboardPage',

  components: {
    LoadingSpinner,
    UserStats,
    RecentUsers,
    DaysChart,
    TeamStats,
    RecentTeams,
  },

  computed: {
    ...mapState('AdminDashboard', [
      'dashboardData',
    ]),

    isTeamsEnabled() {
      return isFeatureEnabled('teams');
    },

    dashboardDays() {
      return get(this.dashboardData, 'days', []);
    },
  },

  async mounted() {
    await this.getData();

    if (getConfig('admin', 'displayDashboardDemoData')) {
      infoToast('Displaying sample data.');
    }
  },

  methods: {
    ...mapLoadableMethods(
      mapActions('AdminDashboard', [
        'getData',
      ]),
    ),
  },
};
</script>

<style scoped>
</style>
