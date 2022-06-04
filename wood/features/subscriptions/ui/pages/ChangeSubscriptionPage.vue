<template>
  <div v-if="initialSubscriptionLoaded">
    <div class="flex flex-col sm:flex-row justify-center w-full sm:w-4/5 mx-auto">
      <choose-subscription
        class="w-full sm:w-1/4"
        @change-product="onChangedPlan"
        @change-price="onChangedPlan"
      />

      <div class="card w-full sm:w-3/4 mt-4 sm:mt-0 sm:ml-8">
        <h2 class="card-header">
          Change Subscription
        </h2>
        <div class="card-body">
          <div v-if="isChangedPlan">
            <loading-spinner v-if="$isLoading('previewChange')" />
            <div
              v-else
              class="divide-y divide-themeBackground-400"
            >
              <div
                v-for="(line, idx) in get(preview, 'lines', [])"
                :key="`line-${idx}`"
                class="flex justify-between py-4 first:pt-0"
              >
                <div>{{ line.description }}</div>
                <div class="whitespace-nowrap ml-4">
                  {{ line.amount }}
                </div>
              </div>
              <div
                v-for="(discount, idx) in get(preview, 'discounts', [])"
                :key="`discount-${idx}`"
                class="flex justify-between py-4 text-themeCelebratory-600"
              >
                <div>Coupon: {{ discount.description }}</div>
                <div class="whitespace-nowrap ml-4">
                  {{ discount.amount }}
                </div>
              </div>
              <div
                v-for="(tax, idx) in get(preview, 'taxes', [])"
                :key="`tax-${idx}`"
                class="flex justify-between py-4"
              >
                <div>Tax: {{ tax.description }}</div>
                <div class="whitespace-nowrap ml-4">
                  {{ tax.amount }}
                </div>
              </div>
              <div class="flex justify-between pt-4 font-bold">
                <div>{{ get(preview, 'total.description', '') }}</div>
                <div class="whitespace-nowrap ml-4">
                  {{ get(preview, 'total.amount', '') }}
                </div>
              </div>
            </div>
          </div>
          <div v-else>
            <p>
              Choose a new plan to see a preview of the changes.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-end space-x-4 mt-4 w-4/5 mx-auto">
      <router-link
        class="btn no-underline hover:text-themeBackground-900"
        :disabled="$isLoading('changeSubscription')"
        to="/subscription"
      >
        Cancel
      </router-link>
      <button
        class="btn-primary"
        :disabled="submitButtonDisabled"
        @click="submit"
      >
        Change Subscription
      </button>
    </div>
  </div>
</template>

<script>
import get from 'lodash/get';
import { mapActions, mapMutations, mapState } from 'vuex';
import { mapLoadableMethods } from 'vue-is-loading';
import LoadingSpinner from '#ui/components/LoadingSpinner';
import ChooseSubscription from '#features/subscriptions/ui/pages/SubscriptionPage/CreateSubscription/ChooseSubscription';
import { successToast } from '#ui/lib/toast';

export default {
  name: 'ChangeSubscriptionPage',

  components: {
    LoadingSpinner,
    ChooseSubscription,
  },

  data: () => ({
    initialSubscriptionLoaded: false,
    preview: null,
  }),

  computed: {
    ...mapState('ActiveUser', [
      'subscription',
    ]),
    ...mapState('Subscriptions', [
      'selectedProduct',
      'selectedPrice',
    ]),

    /**
     * If the submit button should be disabled.
     *
     * @return {Boolean}
     */
    submitButtonDisabled() {
      return this.$isLoading('previewChange')
        || this.$isLoading('changeSubscription')
        || ! this.isChangedPlan;
    },

    /**
     * If the chosen plan is different from the current plan.
     *
     * @return {Boolean}
     */
    isChangedPlan() {
      return this.selectedProduct.id !== this.subscription.product.id
        || this.selectedPrice.id !== this.subscription.price.id;
    },
  },

  watch: {
    /**
     * When subscription changes (i.e. /api/users/me has returned), update the local product/price.
     */
    subscription() {
      this.setInitialPlan();
    },
  },

  /**
   * If arriving on this page directly, user's subscription won't be immediately loaded, so we
   * cannot yet set product/price.
   */
  mounted() {
    if (this.subscription) {
      this.setInitialPlan();
    }
  },

  methods: {
    get,

    ...mapLoadableMethods(
      mapActions('Subscriptions', [
        'previewChange',
        'changeSubscription',
      ]),
    ),

    ...mapMutations('Subscriptions', [
      'setSelectedProduct',
      'setSelectedPrice',
    ]),

    /**
     * Set the starting values for product/price to those from the user's subscription.
     */
    setInitialPlan() {
      this.setSelectedProduct({ product: this.subscription.product });
      this.setSelectedPrice({ price: this.subscription.price });
      this.initialSubscriptionLoaded = true;
    },

    /**
     * When plan is changed, display preview of changes.
     */
    async onChangedPlan() {
      if (this.isChangedPlan) {
        this.preview = await this.previewChange({
          product: this.selectedProduct,
          price: this.selectedPrice,
        });
      }
    },

    /**
     * Submit the support request, and go back to subscription page.
     */
    async submit() {
      await this.changeSubscription({ product: this.selectedProduct, price: this.selectedPrice });
      this.$router.push({ name: 'subscription' });
      successToast('Subscription changed.');
    },
  },
};
</script>
