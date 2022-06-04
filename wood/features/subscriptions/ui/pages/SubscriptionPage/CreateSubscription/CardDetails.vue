<template>
  <form
    class="w-2/5"
    @submit.prevent="submit"
  >
    <div class="card">
      <h2 class="card-header">
        Create Subscription
      </h2>
      <div class="px-8 py-6">
        <div v-if="selectedProduct && products.length > 0">
          <div class="pb-4">
            <div class="text-themePrimary-500 text-xs">
              Plan
            </div>
            <select
              v-if="products.length > 1"
              v-model="localProduct"
              class="w-full border-themeBackground-400"
              :disabled="isSubscriptionUpdating"
            >
              <option
                v-for="product in products"
                :key="product.id"
                :value="product"
              >
                {{ product.value('name') }}
              </option>
            </select>
            <div v-else>
              {{ products[0].value('name') }}
            </div>
          </div>

          <div class="pb-4">
            <div class="text-themePrimary-500 text-xs">
              Price
            </div>
            <select
              v-if="localPrice && localProduct.prices.length > 1"
              v-model="localPrice"
              class="w-full border-themeBackground-400"
              :disabled="isSubscriptionUpdating"
            >
              <option
                v-for="price in localProduct.prices"
                :key="price.id"
                :value="price"
              >
                {{ price.value('intervalPrice') }}
              </option>
            </select>
            <div v-else>
              {{ localProduct.prices[0].value('intervalPrice') }}
            </div>
          </div>
        </div>

        <text-input
          v-model="form.line1"
          class="mb-3"
          input-id="line1"
          label="Billing Address"
          :error-text="addressErrorText"
          :disabled="isSubscriptionUpdating"
        />

        <div class="flex justify-between mb-4">
          <country-input
            v-model="form.country"
            class="w-1/2 mr-2"
            label="Country"
            :error-text="countryErrorText"
            :disabled="isSubscriptionUpdating"
            @change="updateTaxes"
          />
          <state-input
            v-model="form.state"
            class="w-1/2 flex items-end"
            label="State"
            :error-text="stateErrorText"
            :disabled="isSubscriptionUpdating"
            :country="form.country"
            @change="updateTaxes"
          />
        </div>

        <div class="flex justify-between mb-4">
          <text-input
            v-model="form.city"
            class="mr-2 w-full"
            input-id="city"
            label="City"
            :error-text="cityErrorText"
            :disabled="isSubscriptionUpdating"
          />

          <text-input
            v-model="form.postal_code"
            class="w-full"
            input-id="postal_code"
            label="Zip / Postal Code"
            :error-text="postalCodeErrorText"
            :disabled="isSubscriptionUpdating"
          />
        </div>

        <!-- Elements will create input elements here -->
        <div
          id="card-element"
          class="bg-white"
        />

        <!-- We'll put the error messages in this element -->
        <div
          role="alert"
          class="text-sm text-themeCritical-500"
        >
          {{ cardErrors }}
          {{ generalErrorText }}
        </div>
      </div>
    </div>
    <div class="hidden mt-4 sm:flex justify-end items-center">
      <div class="mr-2">
        <loading-spinner
          v-if="isSubscriptionUpdating"
          :size-class="'fa-2x'"
        />
      </div>

      <button
        class="btn-primary"
        :disabled="! formValid || isSubscriptionUpdating"
      >
        Subscribe
      </button>
    </div>
  </form>
</template>

<script>
import get from 'lodash/get';
import first from 'lodash/first';
import { mapActions, mapMutations, mapState } from 'vuex';
import { mapLoadableMethods } from 'vue-is-loading';
import TextInput from '#ui/components/TextInput';
import CountryInput from '#ui/components/CountryInput';
import StateInput from '#ui/components/StateInput';
import LoadingSpinner from '#ui/components/LoadingSpinner';
import { getErrorTitleString, fieldErrorText } from '#ui/lib/forms';
import { successToast } from '#ui/lib/toast';
import {
  SubscriptionValidator,
  SUBSCRIPTION_CARD_FORM_FIELDS,
} from '#features/subscriptions/lib/validators/SubscriptionValidator';
import { STATUS_ACTIVE } from '#features/subscriptions/lib/models/SubscriptionModel';

const validator = new SubscriptionValidator(SUBSCRIPTION_CARD_FORM_FIELDS);

export default {
  name: 'CardDetails',

  components: {
    TextInput,
    CountryInput,
    StateInput,
    LoadingSpinner,
  },

  emits: [
    'change-product',
    'change-price',
    'form-valid',
  ],

  data: () => ({
    form: {
      line1: '',
      country: '',
      state: '',
      city: '',
      postal_code: '',
    },
    apiErrors: {
      line1: [],
      country: [],
      state: [],
      city: [],
      postal_code: [],
      general: [],
    },
    stripe: null,
    card: null,
    cardErrors: '',
    cardValid: false,
    taxes: [],
  }),

  computed: {
    ...mapState('Subscriptions', [
      'isSubscriptionUpdating',
      'selectedTaxes',
      'stripeConfig',
      'selectedProduct',
      'selectedPrice',
    ]),

    addressErrorText: fieldErrorText('line1', validator),
    countryErrorText: fieldErrorText('country', validator),
    stateErrorText: fieldErrorText('state', validator),
    cityErrorText: fieldErrorText('city', validator),
    postalCodeErrorText: fieldErrorText('postal_code', validator),

    localProduct: {
      get() {
        return this.selectedProduct;
      },
      set(newProduct) {
        this.setSelectedProduct({ product: newProduct });
        this.setSelectedPrice({ price: first(this.selectedProduct.prices) });
        this.$emit('change-product');
      },
    },

    localPrice: {
      get() {
        return this.selectedPrice;
      },
      set(newPrice) {
        this.setSelectedPrice({ price: newPrice });
        this.$emit('change-price');
      },
    },

    /**
     * Generate error text for general errors.
     *
     * @return {String}
     */
    generalErrorText() {
      return getErrorTitleString(this.apiErrors.general);
    },

    /**
     * Form is valid if all inputs are full and valid.
     *
     * @return {Boolean}
     */
    formValid() {
      const valid = validator.valid(this.form) && this.cardValid;

      this.$emit('form-valid', valid);

      return valid;
    },

    /**
     * Expose Products list to template.
     */
    products() {
      return get(this.stripeConfig, 'products', []);
    },
  },

  async mounted() {
    const style = {
      base: {
        color: '#000',
        fontSize: '16px',
        backgroundColor: '#fff',
      },
    };

    this.stripe = Stripe(process.env.VUE_APP_STRIPE_PK); // eslint-disable-line new-cap, no-undef
    this.card = this.stripe.elements().create('card', { style, hidePostalCode: true });
    this.card.mount('#card-element');

    this.card.on('change', ({ complete, error }) => {
      this.cardValid = complete;
      this.cardErrors = error ? error.message : '';
    });
  },

  methods: {
    ...mapLoadableMethods(
      mapActions('Subscriptions', [
        'createSubscription',
      ]),
    ),

    ...mapMutations('Subscriptions', [
      'setSelectedTaxes',
      'setSelectedProduct',
      'setSelectedPrice',
    ]),

    /**
     * Updates taxes from country/state choices.
     */
    updateTaxes() {
      this.setSelectedTaxes({ country: this.form.country, state: this.form.state });
    },

    /**
     * Reset form errors arising from the API.
     */
    resetApiErrors() {
      this.cardErrors = '';
      this.apiErrors = {
        line1: [],
        country: [],
        state: [],
        city: [],
        postal_code: [],
        general: [],
      };
    },

    /**
     * Submit the signup form.
     */
    async submit() {
      this.resetApiErrors();

      if (! validator.valid(this.form)) {
        this.apiErrors = validator.errors(this.form, this.apiErrors);
        return;
      }

      try {
        const subscription = await this.createSubscription({
          stripe: this.stripe,
          card: this.card,
          ...this.form,
        });

        if (subscription.status === STATUS_ACTIVE) {
          successToast('Subscription created!');
        }
      }
      catch (error) {
        if (error.constructor.name === 'StripeError') {
          this.cardErrors = error.message;
        }
      }
    },
  },
};
</script>

<style scoped>
.StripeElement {
  @apply border border-themeBackground-400 rounded px-3 py-3 mb-3;
}
</style>
