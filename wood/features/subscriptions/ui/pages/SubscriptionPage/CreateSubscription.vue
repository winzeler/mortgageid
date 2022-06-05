<template>
  <div class="flex flex-col sm:flex-row justify-center sm:space-x-4">
    <card-details
      ref="cardDetails"
      class="w-full sm:w-2/5"
      @form-valid="onCardFormValid"
    />
    <invoice-section class="w-full mt-4 sm:mt-0 sm:w-1/3" />

    <div class="flex mt-4 sm:hidden justify-end items-center">
      <div class="mr-2">
        <loading-spinner
          v-if="isSubscriptionUpdating"
          :size-class="'fa-2x'"
        />
      </div>

      <button
        class="btn-primary"
        :disabled="! cardFormValid || isSubscriptionUpdating"
        @click="$refs.cardDetails.submit"
      >
        Subscribe
      </button>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import CardDetails from '#features/subscriptions/ui/pages/SubscriptionPage/CreateSubscription/CardDetails';
import InvoiceSection from '#features/subscriptions/ui/pages/SubscriptionPage/CreateSubscription/InvoiceSection';
import LoadingSpinner from '#ui/components/LoadingSpinner';

export default {
  name: 'CreateSubscription',

  components: {
    CardDetails,
    InvoiceSection,
    LoadingSpinner,
  },

  data: () => ({
    cardFormValid: false,
  }),

  computed: {
    ...mapState('Subscriptions', [
      'isSubscriptionUpdating',
    ]),
  },

  methods: {
    onCardFormValid(valid) {
      this.cardFormValid = valid;
    },
  },
};
</script>

<style scoped>
</style>
