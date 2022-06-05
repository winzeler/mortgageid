<template>
  <div>
    <div class="text-themePrimary-500 text-xs">
      {{ label }}
    </div>
    <select
      :disabled="disabled"
      :value="modelValue"
      @change="changed"
    >
      <option
        v-for="(name, code) in countries"
        :key="code"
        :value="code"
      >
        {{ name }}
      </option>
    </select>

    <!-- eslint-disable vue/no-v-html -->
    <div
      v-if="errorText.length"
      class="text-themeCritical-500 text-xs"
      v-html="errorText"
    />
    <!-- eslint-enable -->
  </div>
</template>

<script>
import { getConfig } from '#lib/Config';

export default {
  name: 'CountryInput',

  props: {
    /**
     * @type {String} A descriptive label.
     */
    label: {
      type: String,
      required: true,
    },

    /**
     * @type {String} Error text to display on error.
     */
    errorText: {
      type: String,
      default: '',
    },

    /**
     * @type {Boolean} If the component is disabled.
     */
    disabled: {
      type: Boolean,
      default: false,
    },

    /**
     * @type {String} The value of the select input.
     */
    modelValue: {
      type: String,
      default: '',
    },
  },

  emits: [
    'update:modelValue',
    'change',
  ],

  computed: {
    countries() {
      return getConfig('geography', 'countries');
    },
  },

  methods: {
    /**
     * When country is changed, emit input to update v-model, and change so that we can update
     * taxes.
     *
     * @param {Event} event - The event that was triggered.
     */
    changed(event) {
      this.$emit('update:modelValue', event.target.value);
      this.$emit('change', event);
    },
  },
};
</script>

<style scoped>
select {
  @apply
    w-full
    border-themeBackground-400 rounded
    transition-colors ease-in-out duration-200;
}

select:focus, select:active {
  @apply border-themePrimary-500;
}

select:disabled {
  @apply bg-themeBackground-200;
}
</style>
