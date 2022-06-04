<template>
  <div>
    <div
      v-if="! user"
      class="card w-3/5 mx-auto text-center px-8 py-6"
    >
      Loading...
    </div>
    <current-subscription v-else-if="isValidSubscription" />
    <create-subscription v-else />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import CurrentSubscription from '#features/subscriptions/ui/pages/SubscriptionPage/CurrentSubscription';
import CreateSubscription from '#features/subscriptions/ui/pages/SubscriptionPage/CreateSubscription';

const validSubscriptionStatuses = [
  'active',
  'trialing',
  'past_due',
];

export default {
  name: 'SubscriptionPage',

  components: {
    CurrentSubscription,
    CreateSubscription,
  },

  computed: {
    ...mapState('ActiveUser', [
      'user',
      'subscription',
    ]),

    isValidSubscription() {
      return this.subscription && validSubscriptionStatuses.includes(this.subscription.status);
    },
  },
};
</script>

<style scoped>
</style>
