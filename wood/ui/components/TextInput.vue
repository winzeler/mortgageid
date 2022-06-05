<template>
  <div
    class="relative"
    :class="{ error: errorText.length }"
  >
    <input
      :id="inputId"
      ref="input"
      :type="type"
      :autofocus="autofocus"
      :value="modelValue"
      :class="{ filled: modelValue != '' }"
      :disabled="disabled"
      @input="$emit('update:modelValue', $event.target.value)"
      @mouseup="inputUp"
      @keydown="trackValue"
      @keyup.enter="formSubmit"
    >
    <!-- eslint-disable vuejs-accessibility/label-has-for -->
    <label :for="inputId">
      {{ label }}
    </label>
    <!-- eslint-enable -->
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
export default {
  name: 'TextInput',

  props: {
    /**
     * @type {String} The name to apply to the ID of the text input.
     */
    inputId: {
      type: String,
      required: true,
    },

    /**
     * @type {String} A descriptive label.
     */
    label: {
      type: String,
      required: true,
    },

    /**
     * @type {Boolean} If we should autofocus on the text input.
     */
    autofocus: {
      type: Boolean,
      default: false,
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
     * @type {String} The type of text input to use (text or password).
     */
    type: {
      type: String,
      default: 'text',
      validator: (value) => ['text', 'password'].includes(value),
    },

    /**
     * @type {String} The value of the text input.
     */
    modelValue: {
      type: String,
      default: '',
    },
  },

  emits: ['update:modelValue'],

  data: () => ({
    prevValue: '',
  }),

  methods: {
    /**
     * Occasionally, you can click on the label in a location where, once you release the click,
     * the label has moved out of the way and you are now releasing the click on the input.  Some
     * browsers interpret this oddly and won't transfer the focus to the input correctly.  This
     * function forces the focus to the input ANY time a mouseup event happens on the input,
     * regardless of where the click started, fixing this issue.
     */
    inputUp() {
      this.$refs.input.focus();
    },

    /**
     * When pressing "Enter" to confirm an auto-complete selection, we don't want to also submit
     * the form.  To prevent this, we track the value before and after the key-up.  If the value
     * has changed, it means that the "Enter" keypress has confirmed an auto-complete selection,
     * and we don't want to submit the form.  To check that, we need to track what the "previous"
     * value was on every keydown.
     *
     * @param {Event} e - The keydown event.
     */
    trackValue(e) {
      this.prevValue = e.target.value;
    },

    /**
     * When Enter is pressed, attempts to submit the form this TextInput is contained in.
     * Validation is run first.
     *
     * If the TextInput is _not_ inside a form, it will not auto-submit, so be sure to wrap your
     * inputs inside forms to get this functionality.
     *
     * @param {Event} e - The keyup event.
     */
    formSubmit(e) {
      // If this is an auto-complete event, don't submit form
      if (this.prevValue !== e.target.value) {
        this.prevValue = e.target.value;
        return;
      }

      const form = this.$el.closest('form');
      if (form && form.requestSubmit) {
        form.requestSubmit();
      }
    },
  },
};
</script>

<style scoped>
/* Default styles */

input {
  @apply
    border border-themeBackground-400
    appearance-none
    rounded
    w-full
    px-3 pt-5 pb-2
    transition-colors ease-in-out duration-200;
}

.text-input-small input {
  @apply px-2 pt-3 pb-1;
}

input:focus {
  @apply border-themePrimary-500 outline-none;
}

input:active {
  @apply outline-none border-themePrimary-500;
}

input:disabled {
  @apply bg-themeBackground-200;
}

label {
  @apply
    absolute
    mb-0 -mt-2 pt-4 pl-3
    leading-snug
    text-themeBackground-400 text-base
    cursor-text
    transition-all ease-out duration-200;
  top: 0.4rem;
  left: 0;
}

.text-input-small label {
  @apply mb-0 -mt-3 pt-2 pl-1 text-sm;
}

input:focus+label,
input:active+label,
input.filled+label {
  top: -0.1rem;
  @apply
    text-themePrimary-500 text-xs
    transition-all ease-out duration-200;
}

.text-input-small input:focus+label,
.text-input-small input:active+label,
.text-input-small input.filled+label {
  top: 0.3rem;
}

/* Error styles */

.error input {
  @apply border-themeCritical-300;
}

.error input:focus, .error input:active {
  @apply border-themeCritical-500;
}

.error label {
  @apply text-themeCritical-300;
}

.error input:focus+label,
.error input:active+label,
.error input.filled+label {
  @apply text-themeCritical-500;
}
</style>
