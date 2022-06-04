<template>
  <div class="flex justify-center">
    <i
      class="fas fa-spin"
      :class="spinnerClass"
    />
  </div>
</template>

<script setup>
import { computed, toRefs } from 'vue';

const props = defineProps({
  /**
   * @type {String} The icon to display in the spinner.
   * https://fontawesome.com/v5.9/icons?d=gallery&p=1
   */
  iconClass: {
    type: String,
    default: 'fa-circle-notch',
  },

  /**
   * @type {String} The size of the icon to display in the spinner.
   * https://fontawesome.com/v5.9/how-to-use/on-the-web/styling/sizing-icons
   */
  sizeClass: {
    type: String,
    default: 'fa-5x',
  },

  /**
   * @type {String} The tailwind color class to use for the spinner.
   */
  colorClass: {
    type: String,
    default: 'text-themeBackground-700',
  },
});

const { iconClass, sizeClass, colorClass } = toRefs(props);

const spinnerClass = computed(
  () => `${iconClass.value} ${sizeClass.value} ${colorClass.value}`,
);
</script>
