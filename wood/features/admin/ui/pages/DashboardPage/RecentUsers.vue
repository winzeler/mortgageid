<template>
  <div class="card">
    <h2 class="card-header">
      Recent users
    </h2>
    <div class="card-body flex flex-col space-y-4">
      <template
        v-for="(user, key) in recentUsers"
        :key="key"
      >
        <recent-user
          :name="user.value('name')"
          :email="user.value('email')"
          :plan="user.plan ? user.value('plan') : undefined"
          :mrr="user.mrr ? user.value('mrr') : undefined"
          :joined="user.value('joined')"
        />
      </template>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import RecentUser from '#features/admin/ui/pages/DashboardPage/RecentUsers/RecentUser';

export default {
  name: 'RecentUsers',

  components: {
    RecentUser,
  },
  computed: {
    ...mapState('AdminDashboard', [
      'dashboardData',
    ]),

    recentUsers() {
      return this.dashboardData ? this.dashboardData.recentUsers : [];
    },
  },
};
</script>

<style scoped>
</style>
