<template>
  <div class="card">
    <h2 class="card-header">
      Your Subscription: {{ subscription.value('name') }}
    </h2>
    <div class="card-body">
      <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 justify-between">
        <div>
          {{ subscription.value('description') }}
        </div>
        <div class="space-y-4 sm:space-y-0">
          <div
            v-if="subscription.trialEndsAt"
            class="flex flex-row flex-grow-0 w-full justify-between"
          >
            <div>
              {{ subscription.label('trialEndsAt') }}
            </div>
            <div class="font-bold ml-4">
              {{ subscription.value('trialEndsAt') }}
            </div>
          </div>
          <div
            v-else
            class="flex flex-row flex-grow-0 w-full justify-between"
          >
            <div>
              {{ subscription.label('nextBillingDate') }}
            </div>
            <div class="font-bold ml-4">
              {{ subscription.value('nextBillingDate') }}
            </div>
          </div>
          <div class="flex flex-row flex-grow-0 w-full justify-between">
            <div>
              {{ subscription.label('youPay') }}
            </div>
            <div class="font-bold ml-4">
              {{ subscription.value('youPay') }}
            </div>
          </div>
          <div
            v-if="subscription.status === 'past_due'"
            class="flex flex-row flex-grow-0 w-full justify-between"
          >
            <div>
              Status:
            </div>
            <div class="font-bold text-themeCritical-700 ml-4">
              Past Due
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'SubscriptionDetails',

  computed: {
    ...mapState('ActiveUser', [
      'subscription',
    ]),
  },
};
</script>
