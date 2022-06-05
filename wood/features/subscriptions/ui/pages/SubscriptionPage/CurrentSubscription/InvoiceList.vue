<template>
  <div class="card">
    <h2 class="card-header">
      Invoices:
    </h2>
    <div class="card-body">
      <div v-if="$isLoading('loadInvoices')">
        Loading...
      </div>
      <div v-else>
        <div v-if="invoices.length > 0">
          <a
            v-for="invoice in invoices"
            :key="invoice.id"
            :href="invoice.invoicePdf"
            class="mb-4 p-3 card-sm flex justify-between"
            target="_blank"
          >
            <div>{{ invoice.value('created') }}</div>
            <div>
              {{ invoice.value('total') }}
              ({{ invoice.value('status') }})
            </div>
          </a>
        </div>
        <div v-else>
          No invoices.
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { mapLoadableMethods } from 'vue-is-loading';

export default {
  name: 'InvoiceList',

  computed: {
    ...mapState('Subscriptions', [
      'invoices',
    ]),
  },

  async created() {
    await this.loadInvoices();
  },

  methods: {
    ...mapLoadableMethods(
      mapActions('Subscriptions', [
        'loadInvoices',
      ]),
    ),
  },
};
</script>
