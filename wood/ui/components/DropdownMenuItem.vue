<template>
  <li>
    <a
      class="menu-item"
      @click="onClickMenu"
    >
      <slot />
    </a>
  </li>
</template>

<script>
export default {
  name: 'DropdownMenuItem',

  props: {
    /**
     * @type {String} Route URL to navigate to on click (optional).
     */
    to: {
      type: String,
      default: null,
    },

    /**
     * @type {Function} Function to execute on click (optional).
     */
    click: {
      type: Function,
      default: null,
    },
  },

  methods: {
    onClickMenu() {
      this.$parent.hideMenu();
      if (this.to) {
        this.$router.push(this.to);
      }
      else if (this.click) {
        this.click();
      }
    },
  },
};
</script>

<style scoped>
.menu-item {
  @apply px-4 py-2 block text-themeBackground-900 no-underline cursor-pointer;
}
.menu-item:hover {
  @apply bg-themePrimary-500 text-white no-underline;
}
</style>
