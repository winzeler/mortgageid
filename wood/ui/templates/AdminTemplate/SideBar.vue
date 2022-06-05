<template>
  <div class="sidebar">
    <div class="h-screen flex flex-col">
      <div class="py-4">
        <img
          alt="Application icon"
          class="w-8 h-8 mr-3 inline-block"
          :src="logoSource"
        >
        <span class="app-name">
          {{ appName }}
        </span>
      </div>

      <ul>
        <li
          v-for="(entry, idx) in adminMenuEntries"
          :key="idx"
          @click="$emit('navigate')"
        >
          <router-link
            v-if="canDisplaySidebarItem(entry)"
            :class="{ active : $route.path === entry.path }"
            class="router-link"
            :to="entry.path"
          >
            <i
              class="fas fa-fw mr-3"
              :class="entry.icon"
            />
            <span>{{ entry.name }}</span>
          </router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import get from 'lodash/get';
import { mapState } from 'vuex';
import { canAccessResource } from '#ui/lib/AccessControl';
import { getConfig } from '#lib/Config';

export default {
  name: 'SideBar',

  emits: ['navigate'],

  computed: {
    ...mapState('ActiveUser', [
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
     * The admin menu entries that appear in the sidebar.
     *
     * @return {Array}
     */
    adminMenuEntries() {
      return getConfig('ui', 'adminMenuEntries');
    },

    /**
     * Load the logo dynamically from either wood or app.
     */
    logoSource() {
      return require('#ui/assets/logo.svg'); // eslint-disable-line global-require
    },
  },

  methods: {
    /**
     * If the user's role has the required permissions and their subscription has the required
     * capabilities to show this sidebar item.
     *
     * @param {Object} entry - The sidebar entry to check.
     *
     * @return {Boolean}
     */
    canDisplaySidebarItem(entry) {
      return canAccessResource(
        this.subscription,
        get(entry, 'capabilities', []),
        this.role,
        get(entry, 'permissions', []),
      );
    },
  },
};
</script>

<style scoped>
.app-name {
  @apply text-themeBackground-600 mt-1;
}

.sidebar {
  @apply
    fixed h-full w-16 top-0 left-0 bottom-0 px-4
    bg-white shadow
    transition-all ease-in-out duration-300 z-50;
}
.sidebar.active {
  @apply shadow-2xl;
  width: 200px;
}
.sidebar.active span {
  @apply transition-all ease-in duration-300 opacity-100;
}

li {
  @apply my-2
}

.router-link {
  @apply block py-1 pl-1 align-middle text-themeBackground-600 no-underline;
}
.router-link:hover {
  @apply text-themePrimary-500;
}

.router-link.active {
  @apply text-themePrimary-500;
}

span {
  @apply inline-block pb-1 text-sm opacity-0 absolute transition-all ease-out duration-200;
}

@screen md {
  li {
    @apply my-0;
  }

  .router-link {
    @apply py-3;
  }

  span {
    @apply pb-0;
  }
}
</style>
