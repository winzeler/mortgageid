<template>
  <div class="absolute top-0 right-0 text-sm flex mt-4 mr-6">
    <dropdown-menu
      menu-wrapper-classes="card-xs"
      menu-button-classes="card-body"
      menu-dropdown-classes="right-0"
    >
      <template #menu-text>
        <img
          class="w-8 h-8 rounded-full mr-4"
          :src="profileSource"
          alt="Gravatar"
        >
        {{ userName }}
      </template>

      <template v-for="(entry, idx) in userMenuEntries">
        <dropdown-menu-item
          v-if="canDisplayMenuItem(entry)"
          :key="idx"
          :to="entry.path"
        >
          {{ entry.name }}
        </dropdown-menu-item>
      </template>

      <template v-if="isAdmin">
        <dropdown-menu-divider />
        <dropdown-menu-item
          class="whitespace-nowrap"
          to="/admin"
        >
          Admin Panel
        </dropdown-menu-item>
      </template>

      <dropdown-menu-divider />
      <dropdown-menu-item :click="onLogout">
        Logout
      </dropdown-menu-item>
    </dropdown-menu>
  </div>
</template>

<script>
import md5 from 'md5';
import get from 'lodash/get';
import { mapState, mapActions } from 'vuex';
import { canAccessResource } from '#ui/lib/AccessControl';
import DropdownMenu from '#ui/components/DropdownMenu';
import DropdownMenuItem from '#ui/components/DropdownMenuItem';
import DropdownMenuDivider from '#ui/components/DropdownMenuDivider';
import { getConfig } from '#lib/Config';

export default {
  name: 'UserMenu',

  components: {
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuDivider,
  },

  computed: {
    ...mapState('ActiveUser', [
      'user',
      'subscription',
      'role',
    ]),

    /**
     * The menu entries that appear in the dropdown menu, above the separator.
     *
     * @return {Array}
     */
    userMenuEntries() {
      return getConfig('ui', 'userMenuEntries');
    },

    /**
     * The active user's username, or blank if no user loaded.
     *
     * @return {String}
     */
    userName() {
      return this.user ? this.user.name : '';
    },

    /**
     * The active user's gravatar URL, or blank if no user loaded.
     *
     * @return {String}
     */
    gravatarUrl() {
      return this.user
        ? `https://www.gravatar.com/avatar/${md5(this.user.email.trim().toLowerCase())}`
        : '';
    },

    /**
     * Load the logo dynamically from either wood or app.
     */
    profileSource() {
      return require('#ui/assets/user-solid.svg'); // eslint-disable-line global-require
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
</style>
