<template>
  <div class="absolute top-0 right-0 text-sm flex mt-4 mr-6">
    <dropdown-menu
      menu-wrapper-classes="card-xs"
      menu-button-classes="card-body"
    >
      <template #menu-text>
        <img
          class="w-8 h-8 rounded-full mr-4"
          :src="gravatarUrl"
          alt="Gravatar"
        >
        {{ userName }}
      </template>

      <template
        v-for="(entry, idx) in userMenuEntries"
        :key="idx"
      >
        <dropdown-menu-item :to="entry.path">
          {{ entry.name }}
        </dropdown-menu-item>
      </template>

      <dropdown-menu-divider />
      <dropdown-menu-item to="/">
        App Home
      </dropdown-menu-item>
      <dropdown-menu-divider />
      <dropdown-menu-item :click="onLogout">
        Logout
      </dropdown-menu-item>
    </dropdown-menu>
  </div>
</template>

<script>
import md5 from 'md5';
import { mapState, mapActions } from 'vuex';
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
  },

  methods: {
    ...mapActions('ActiveUser', [
      'logout',
    ]),

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
