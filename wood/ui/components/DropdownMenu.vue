<template>
  <div
    v-click-outside="hideMenu"
    class="menu-wrapper"
    :class="menuWrapperClasses"
  >
    <div
      class="menu-button"
      :class="menuButtonClasses"
      @click="clickButton"
    >
      <slot name="menu-text" />
      <svg
        class="pl-2 h-2"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 129 129"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        enable-background="new 0 0 129 129"
      >
        <g>
          <!-- eslint-disable-next-line max-len -->
          <path d="m121.3,34.6c-1.6-1.6-4.2-1.6-5.8,0l-51,51.1-51.1-51.1c-1.6-1.6-4.2-1.6-5.8,0-1.6,1.6-1.6,4.2 0,5.8l53.9,53.9c0.8,0.8 1.8,1.2 2.9,1.2 1,0 2.1-0.4 2.9-1.2l53.9-53.9c1.7-1.6 1.7-4.2 0.1-5.8z" />
        </g>
      </svg>
    </div>

    <div
      class="menu-dropdown"
      :class="{
        'dropdown-hidden': ! menuVisible,
        ...menuDropdownClasses.split(' ')
          .reduce(
            (classes, key) => {
              classes[key] = true;
              return classes;
            },
            {}
          )
      }"
    >
      <ul>
        <slot />
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DropdownMenu',

  props: {
    /**
     * @type {String} Classes to apply to the menu wrapper specifically.
     */
    menuWrapperClasses: {
      type: String,
      default: '',
    },
    /**
     * @type {String} Classes to apply to the menu button specifically.
     */
    menuButtonClasses: {
      type: String,
      default: '',
    },

    /**
     * @type {String} Classes to apply to the dropdown button container specifically.
     */
    menuDropdownClasses: {
      type: String,
      default: '',
    },
  },

  data: () => ({
    menuVisible: false,
  }),

  methods: {
    /**
     * Toggle the menu when user button is clicked.
     */
    clickButton() {
      this.menuVisible = ! this.menuVisible;
    },

    /**
     * Hide the menu when clicking outside the menu component.
     */
    hideMenu() {
      this.menuVisible = false;
    },
  },
};
</script>

<style scoped>
.menu-wrapper {
  @apply
    relative inline-block
    text-sm;
}

.menu-button {
  @apply
    flex items-center
    cursor-pointer;
}

.menu-dropdown {
  @apply
    bg-white
    rounded shadow-md
    mt-2 top-auto w-auto min-w-full
    absolute overflow-hidden
    z-30
    opacity-100 visible
    transition-opacity ease-out duration-200;
}

.menu-dropdown.dropdown-hidden {
  @apply
    opacity-0 invisible
    transition-opacity ease-out duration-500;
}
</style>
