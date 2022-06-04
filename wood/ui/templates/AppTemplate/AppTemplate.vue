<template>
  <div class="w-full h-full relative flex flex-row bg-themeBackground-200">
    <div @mouseover="show">
      <side-bar
        class="hidden sm:block"
        :class="{ active: menuActive }"
        @navigate="hide"
      />
      <top-bar
        class="block sm:hidden"
        :class="{ active: menuActive }"
        @navigate="hide"
        @toggle="toggle"
      />
    </div>

    <transition name="fade">
      <div
        v-if="menuActive"
        class="overlay"
        @click="menuActive = false"
      />
    </transition>

    <div class="w-full h-full px-3 sm:px-6 py-2 sm:py-4 ml-0 sm:ml-16">
      <div class="w-full justify-between mb-2 hidden sm:flex">
        <user-menu />
      </div>

      <router-view class="mt-16" />
    </div>
  </div>
</template>

<script>
import UserMenu from '#ui/templates/AppTemplate/UserMenu';
import SideBar from '#ui/templates/AppTemplate/SideBar';
import TopBar from '#ui/templates/AppTemplate/TopBar';

export default {
  name: 'AppTemplate',

  components: {
    UserMenu,
    SideBar,
    TopBar,
  },

  emits: ['mouseover'],

  data: () => ({
    menuActive: false,
  }),

  methods: {
    show() {
      this.menuActive = true;
    },

    hide() {
      this.menuActive = false;
    },

    toggle() {
      this.menuActive = ! this.menuActive;
    },
  },
};
</script>

<style scoped>
.overlay {
  @apply absolute inset-0 z-40 cursor-pointer;
  background-color: rgba(0, 0, 0, 0.2);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
