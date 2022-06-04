<template>
  <div>
    <div
      v-if="selectedProduct"
      class="card divide-y"
    >
      <!-- Plan -->
      <div class="flex justify-between p-3">
        <div>
          <div class="font-bold">
            {{ selectedProduct.value('name') }}
          </div>
          <ul
            v-for="(bullet, key) in selectedProduct.bullets"
            :key="key"
            class="text-themeBackground-600 text-sm pl-4 list-disc"
          >
            <li>{{ bullet }}</li>
          </ul>
        </div>
        <div>{{ selectedPrice.value('intervalPrice') }}</div>
      </div>

      <!-- Coupon -->
      <div
        v-if="selectedCoupon"
        class="flex justify-between p-3 text-themeCelebratory-600"
      >
        <div>
          <div>
            {{ selectedCoupon.displayName() }}
            ({{ selectedCoupon.value('discountText') }})
          </div>
          <div class="text-xs">
            {{ upperFirst(selectedCoupon.value('durationText')) }}
          </div>
        </div>
        <div>
          {{ selectedCoupon.getDiscountText(selectedPrice.unitAmount, selectedPrice.currency) }}
        </div>
      </div>
      <form
        v-else
        class="p-3 flex justify-between"
        @submit.prevent="onClickApplyCoupon"
      >
        <text-input
          v-model="form.coupon"
          input-id="coupon"
          label="Coupon Code"
          class="text-input-small w-full pr-4"
          :error-text="couponErrorText"
          :disabled="isSubscriptionUpdating"
        />

        <button
          class="btn-primary"
          :disabled="! canApplyCoupon"
          @click="onClickApplyCoupon"
        >
          Apply
        </button>
      </form>

      <!-- Taxes -->
      <div
        v-for="tax in selectedTaxes"
        :key="tax.id"
        class="flex justify-between p-3"
      >
        <div>Tax: {{ tax.fullName() }}</div>
        <div>
          {{ currencyFormat(tax.taxesOn(subtotalCoupon), selectedPrice.currency) }}
        </div>
      </div>

      <!-- Total -->
      <div class="flex justify-between p-3 font-bold">
        <div>Total:</div>
        <div>{{ totalPrice }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import { mapLoadableMethods } from 'vue-is-loading';
import upperFirst from 'lodash/upperFirst';
import TextInput from '#ui/components/TextInput';
import { fieldErrorText } from '#ui/lib/forms';
import { currencyFormat, intervalPrice } from '#lib/Text';
import { SubscriptionValidator } from '#features/subscriptions/lib/validators/SubscriptionValidator'; // eslint-disable-line max-len

const validator = new SubscriptionValidator(['coupon']);

export default {
  name: 'InvoiceSection',

  components: {
    TextInput,
  },

  data: () => ({
    form: {
      coupon: '',
    },
    apiErrors: {
      coupon: [],
    },
  }),

  computed: {
    ...mapState('Subscriptions', [
      'isSubscriptionUpdating',
      'selectedProduct',
      'selectedPrice',
      'selectedTaxes',
      'selectedCoupon',
    ]),

    couponErrorText: fieldErrorText('coupon', validator),

    /**
     * Form is valid if all inputs are full and valid.
     *
     * @return {Boolean}
     */
    formValid() {
      return validator.valid(this.form);
    },

    /**
     * Can submit the coupon code form.
     *
     * @return {Boolean}
     */
    canApplyCoupon() {
      return this.formValid
        && this.form.coupon.trim().length > 0
        && ! this.isSubscriptionUpdating;
    },

    /**
     * The subtotal of this subscription, including the coupon (if any), in cents.
     *
     * @return {Number}
     */
    subtotalCoupon() {
      const couponDiscount = this.selectedCoupon
        ? this.selectedCoupon.getDiscountCents(
          this.selectedPrice.unitAmount,
          this.selectedPrice.currency,
        ) : 0;

      return this.selectedPrice.unitAmount - couponDiscount;
    },

    /**
     * The subtotal of this subscription, including the coupon & taxes (if any), in cents.
     *
     * @return {Number}
     */
    subtotalTaxes() {
      return this.selectedTaxes.reduce(
        (acc, tax) => acc + (tax.inclusive ? 0 : tax.taxesOn(this.subtotalCoupon)),
        this.subtotalCoupon,
      );
    },

    /**
     * Calculate and display the total price for this subscription, including taxes & coupons.
     *
     * @return {String}
     */
    totalPrice() {
      return intervalPrice(
        this.subtotalTaxes,
        this.selectedPrice.currency,
        this.selectedPrice.interval,
        this.selectedPrice.intervalCount,
      );
    },
  },

  methods: {
    currencyFormat,
    upperFirst,

    ...mapLoadableMethods(
      mapActions('Subscriptions', [
        'applyCoupon',
      ]),
    ),

    /**
     * Reset form errors arising from the API.
     */
    resetApiErrors() {
      this.apiErrors = {
        coupon: [],
      };
    },

    /**
     * Apply the coupon to update price.
     */
    async onClickApplyCoupon() {
      this.resetApiErrors();

      if (! validator.valid(this.form)) {
        this.apiErrors = validator.errors(this.form, this.apiErrors);
        return;
      }

      await this.applyCoupon({ id: this.form.coupon });
    },
  },
};
</script>
