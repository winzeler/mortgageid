<template>
  <div class="app-menu">
    <div class="flex flex-col">
      <div class="title-bar">
        <img
          alt="Application icon"
          class="w-8 h-8 mr-3 inline-block"
          :src="logoSource"
        >
        <span class="app-name">
          {{ appName }}
        </span>
        <i
          class="fas fa-bars p-4"
          @click="$emit('toggle')"
        />
        <i
          class="fas fa-times p-4 hidden"
          @click="$emit('toggle')"
        />
      </div>

      <ul class="menu-items">
        <li
          v-for="(entry, idx) in adminMenuEntries"
          :key="idx"
          :class="{ 'border-t pt-2': idx === 0 }"
          @click="$emit('navigate')"
        >
          <router-link
            v-if="canDisplayMenuItem(entry)"
            :class="{ active : $route.path === entry.path }"
            class="router-link"
            :to="entry.path"
          >
            <i
              class="fas fa-fw mr-3"
              :class="entry.icon"
            />
            <span class="inline-block pb-1 text-sm absolute">
              {{ entry.name }}
            </span>
          </router-link>
        </li>

        <li
          v-for="(entry, idx) in userMenuEntries"
          :key="idx"
          :class="{ 'border-t mt-2 pt-2': idx === 0 }"
          @click="$emit('navigate')"
        >
          <router-link
            v-if="canDisplayMenuItem(entry)"
            :class="{ active : $route.path === entry.path }"
            class="router-link"
            :to="entry.path"
          >
            {{ entry.name }}
          </router-link>
        </li>

        <template v-if="isAdmin">
          <li @click="$emit('navigate')">
            <router-link
              class="router-link"
              to="/"
            >
              App Home
            </router-link>
          </li>
        </template>

        <li class="text-right border-t pr-4 py-2">
          <a
            class="router-link"
            @click="onLogout"
          >
            Logout
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import get from 'lodash/get';
import { mapActions, mapState } from 'vuex';
import { canAccessResource } from '#ui/lib/AccessControl';
import { getConfig } from '#lib/Config';

export default {
  name: 'TopBar',

  emits: ['navigate', 'toggle'],

  computed: {
    ...mapState('ActiveUser', [
      'user',
      'subscription',
      'role',
    ]),

    /**
     * The application name that appears next to the logo.
     *
     * @return {String}
     */
    appName() {
      return getConfig('app', 'name');
    },

    /**
     * The menu entries that appear in the menu.
     *
     * @return {Array}
     */
    adminMenuEntries() {
      return getConfig('ui', 'adminMenuEntries');
    },

    /**
     * The user menu entries that appear in the dropdown menu.
     *
     * @return {Array}
     */
    userMenuEntries() {
      return getConfig('ui', 'userMenuEntries');
    },

    /**
     * Load the logo dynamically from either wood or app.
     */
    logoSource() {
      return require('#ui/assets/logo.svg'); // eslint-disable-line global-require
    },

    /**
     * If the active user is an admin user.
     *
     * @return {Boolean}
     */
    isAdmin() {
      return this.user ? this.user.isAdmin() : false;
    },
  },

  methods: {
    ...mapActions('ActiveUser', [
      'logout',
    ]),

    /**
     * If the user's role has the required permissions and their subscription has the required
     * capabilities to show this menu item.
     *
     * @param {Object} entry - The menu entry to check.
     *
     * @return {Boolean}
     */
    canDisplayMenuItem(entry) {
      return canAccessResource(
        this.subscription,
        get(entry, 'capabilities', []),
        this.role,
        get(entry, 'permissions', []),
      );
    },

    /**
     * On logout menu item clicked, log out and redirect to /login
     */
    async onLogout() {
      await this.logout();
      this.$router.push('/login');
    },
  },
};
</script>

<style scoped>
.app-name {
  @apply text-lg text-themeBackground-600 flex-grow;
}
.app-menu {
  @apply fixed w-full z-50;
}

.title-bar {
  @apply
    flex flex-row w-full items-center
    py-4 max-h-16 top-0 left-0 right-0 px-4
    bg-white shadow;
}
.app-menu.active .title-bar {
  @apply shadow-none;
}
.app-menu.active .fa-times {
  @apply block;
}
.app-menu.active .fa-bars {
  @apply hidden;
}

.menu-items {
  @apply
    hidden opacity-0 transition-opacity ease-in-out duration-500
    bg-white shadow-2xl
    h-full;
}
.app-menu.active .menu-items {
  @apply block opacity-100;
}

.router-link {
  @apply inline-block py-1 pl-4 align-middle text-themeBackground-600 no-underline text-sm;
}
.router-link.active {
  @apply text-blue-500;
}
</style>
