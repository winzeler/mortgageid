<template>
  <div class="card w-1/3">
    <h2 class="card-header">
      {{ noTeamPageHeader }}
    </h2>

    <div class="card-body">
      <p>{{ noTeamPageBodyOne }}</p>
      <p>
        {{ noTeamPageBodyTwo }}
        <a :href="`mailto:${supportEmail}`">
          email support
        </a>.
      </p>
    </div>
  </div>
</template>

<script>
import { getConfig, getLanguageString } from '#lib/Config';

export default {
  name: 'NoTeamPage',

  data: () => ({
    supportEmail: getConfig('email', 'supportEmail'),
  }),

  computed: {
    noTeamPageHeader: () => getLanguageString('teams', 'noTeamPageHeader'),
    noTeamPageBodyOne: () => getLanguageString('teams', 'noTeamPageBodyOne'),
    noTeamPageBodyTwo: () => getLanguageString('teams', 'noTeamPageBodyTwo'),
  },
};
</script>

<style scoped>
</style>
