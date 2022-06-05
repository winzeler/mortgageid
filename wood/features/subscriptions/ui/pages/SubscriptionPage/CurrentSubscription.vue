<template>
  <div>
    <subscription-details class="w-full sm:w-3/5 mx-auto" />

    <div class="w-full sm:w-3/5 mx-auto mt-4 flex justify-end space-x-4">
      <router-link
        class="text-center sm:text-left text-themeCritical-500 hover:text-themeBackground-900 mt-2"
        to="/subscription/cancel"
      >
        Cancel subscription
      </router-link>
      <router-link
        class="text-center sm:text-left btn no-underline hover:text-themeBackground-900"
        to="/subscription/change"
      >
        Change subscription
      </router-link>
    </div>

    <invoice-list class="mt-4 w-full sm:w-3/5 mx-auto" />
  </div>
</template>

<script>
import SubscriptionDetails from '#features/subscriptions/ui/pages/SubscriptionPage/CurrentSubscription/SubscriptionDetails';
import InvoiceList from '#features/subscriptions/ui/pages/SubscriptionPage/CurrentSubscription/InvoiceList';

export default {
  name: 'CurrentSubscription',

  components: {
    SubscriptionDetails,
    InvoiceList,
  },
};
</script>
