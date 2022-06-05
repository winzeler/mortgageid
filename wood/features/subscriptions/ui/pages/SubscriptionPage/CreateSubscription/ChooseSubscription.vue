<template>
  <div>
    <div class="card pt-4">
      <div v-if="selectedProduct && products.length > 0">
        <div class="px-4 pb-4">
          <select
            v-if="products.length > 1"
            v-model="localProduct"
            class="w-full"
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

        <div class="px-4 pb-4">
          <select
            v-if="localPrice && localProduct.prices.length > 1"
            v-model="localPrice"
            class="w-full"
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

        <div
          v-for="product in products"
          :key="product.id"
        >
          <div
            v-if="product.id === localProduct.id"
          >
            <!-- eslint-disable vue/no-v-html -->
            <div
              class="p-3 text-center border-b border-t"
              v-html="product.value('description')"
            />
            <div
              v-for="(bullet, key) in product.bullets"
              :key="key"
              class="p-3"
            >
              <i class="fas fa-fw mr-3 fa-check" />
              <span v-html="bullet" />
            </div>
            <!-- eslint-enable -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import get from 'lodash/get';
import first from 'lodash/first';
import { mapState, mapMutations } from 'vuex';

export default {
  name: 'ChooseSubscription',

  emits: [
    'change-product',
    'change-price',
  ],

  computed: {
    ...mapState('Subscriptions', [
      'isSubscriptionUpdating',
      'stripeConfig',
      'selectedProduct',
      'selectedPrice',
    ]),

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
     * Expose Products list to template.
     */
    products() {
      return get(this.stripeConfig, 'products', []);
    },
  },

  methods: {
    ...mapMutations('Subscriptions', [
      'setSelectedProduct',
      'setSelectedPrice',
    ]),
  },
};
</script>
