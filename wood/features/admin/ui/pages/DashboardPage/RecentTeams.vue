<template>
  <div class="card">
    <h2 class="card-header">
      Recent teams
    </h2>
    <div class="card-body flex flex-col space-y-4">
      <template
        v-for="(team, key) in recentTeams"
        :key="key"
      >
        <recent-team
          :name="team.value('name')"
          :plan="team.plan ? team.value('plan') : undefined"
          :mrr="team.mrr ? team.value('mrr') : undefined"
          :joined="team.value('joined')"
        />
      </template>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import RecentTeam from '#features/admin/ui/pages/DashboardPage/RecentTeams/RecentTeam';

export default {
  name: 'RecentUsers',

  components: {
    RecentTeam,
  },
  computed: {
    ...mapState('AdminDashboard', [
      'dashboardData',
    ]),

    recentTeams() {
      return this.dashboardData ? this.dashboardData.recentTeams : [];
    },
  },
};
</script>

<style scoped>
</style>
