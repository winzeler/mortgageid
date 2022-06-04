<template>
  <div>
    <div
      v-if="states.length > 0"
      class="w-full"
    >
      <div class="text-themePrimary-500 text-xs">
        {{ label }}
      </div>
      <select
        v-if="states.length > 0"
        class="w-full border-themeBackground-400
          focus:active:border-themePrimary-500 focus:active:outline-none"
        :disabled="disabled"
        :value="modelValue"
        @change="dropdownChanged"
      >
        <option
          v-for="state in states"
          :key="state"
          :value="state"
        >
          {{ state }}
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

    <text-input
      v-else
      class="w-full"
      input-id="state"
      :model-value="modelValue"
      :label="label"
      :error-text="errorText"
      :disabled="disabled"
      @input="dropdownChanged"
    />
  </div>
</template>

<script>
import TextInput from '#ui/components/TextInput';
import { getConfig } from '#lib/Config';

export default {
  name: 'StateInput',

  components: {
    TextInput,
  },

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

    /**
     * @type {String} The country to display states for.
     */
    country: {
      type: String,
      default: '',
    },
  },

  emits: [
    'update:modelValue',
    'change',
  ],

  data: () => ({
    textTimeoutId: null,
  }),

  computed: {
    states() {
      const states = getConfig('geography', 'states');
      return Object.keys(states).includes(this.country) ? states[this.country] : [];
    },
  },

  methods: {
    /**
     * When state dropdown is changed, emit input to update v-model, and change event so that we can
     * update taxes immediately.
     *
     * @param {Event} event - The event that was triggered.
     */
    dropdownChanged(event) {
      this.$emit('update:modelValue', event.target.value);
      this.$emit('change', event);
    },

    /**
     * When user is typing in text for state, wait half a second after they've finished typing
     * before we send the change event. This prevents every single keystroke from triggering the
     * tax update.
     *
     * The input is emitted immediately, so the component's state is always correct.
     *
     * @param {Event} event - The event that was triggered.
     */
    textChanged(event) {
      this.$emit('update:modelValue', event.target.value);
      clearTimeout(this.textTimeoutId);
      this.textTimeoutId = setTimeout(() => this.$emit('change', event), 500);
    },
  },
};
</script>
