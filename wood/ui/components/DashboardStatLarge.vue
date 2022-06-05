<template>
  <div class="flex items-center">
    <div>
      <i
        class="fas fa-3x"
        :class="[icon, iconColor]"
      />
    </div>
    <div class="flex flex-col w-full px-6 leading-tight items-center">
      <div :class="labelClass">
        {{ label }}
      </div>
      <div :class="valueClass">
        {{ value }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DashboardStatLarge',

  props: {
    /**
     * @type {String} The font awesome icon name for this stat.
     */
    icon: {
      type: String,
      required: true,
    },

    /**
     * @type {String} The tailwind colour for this icon.
     */
    iconColor: {
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
     * @type {String} Classes for the label.
     */
    labelClass: {
      type: String,
      default: 'text-themeBackground-700 text-sm',
    },

    /**
     * @type {String} The stat value.
     */
    value: {
      type: [String, Number],
      required: true,
    },

    /**
     * @type {String} Classes for the value.
     */
    valueClass: {
      type: String,
      default: 'text-4xl font-bold',
    },
  },
};
</script>

<style scoped>
</style>
