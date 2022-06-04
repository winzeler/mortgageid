<template>
  <div class="card w-4/5 mx-auto">
    <h2 class="card-header">
      Buttons
    </h2>
    <div class="card-body">
      <div class="mb-6 buttons-row">
        <button>Default button</button>
        <button disabled="disabled">
          Disabled default button
        </button>
        <button class="btn-primary">
          Primary button
        </button>
        <button
          class="btn-primary"
          disabled="disabled"
        >
          Disabled primary button
        </button>
        <button class="btn-secondary">
          Secondary button
        </button>
        <button
          class="btn-secondary"
          disabled="disabled"
        >
          Disabled secondary button
        </button>
      </div>

      <h2>Simple Components</h2>
      <div class="flex mb-6 relative">
        <dropdown-menu class="mr-4">
          <template #menu-text>
            <img
              class="w-8 h-8 rounded-full mr-4"
              src="https://i.pravatar.cc/32"
              alt="Avatar of User"
            >
            <span class="hidden md:inline-block">Hi, User</span>
          </template>
          <dropdown-menu-item to="/">
            Home
          </dropdown-menu-item>
          <dropdown-menu-item :click="logConsole">
            Log console
          </dropdown-menu-item>
          <dropdown-menu-divider />
          <dropdown-menu-item to="/logout">
            Logout
          </dropdown-menu-item>
        </dropdown-menu>

        <text-input
          v-model="textInputValue"
          class="mr-4"
          input-id="text-input"
          label="Text input"
        />

        <p>Text input value: "{{ textInputValue }}"</p>

        <text-input
          v-model="smallTextInputValue"
          class="mr-4 text-input-small"
          input-id="small-text-input"
          label="Small text input"
        />
      </div>

      <h2>Tables & Pagination</h2>
      <table class="w-full wood-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Account Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Daniel McManiel</td>
            <td>daniel@mcmaniel.com</td>
            <td>Admin</td>
            <td class="actions">
              <div>
                <a>Edit</a>
                <a>Delete</a>
                <a>Reset Password</a>
              </div>
            </td>
          </tr>
          <tr>
            <td>Sean Dainyne</td>
            <td>sean@dainyne.com</td>
            <td>Admin</td>
            <td class="actions">
              <div>
                <a>Edit</a>
                <a>Delete</a>
                <a>Reset Password</a>
              </div>
            </td>
          </tr>
          <tr>
            <td>Chris Redfield</td>
            <td>credfield@stars.gov</td>
            <td>User</td>
            <td class="actions">
              <div>
                <a>Edit</a>
                <a>Delete</a>
                <a>Reset Password</a>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <pagination-row
        :search-enabled="true"
        :page="1"
        :pages="8"
        :per="20"
      />
    </div>
  </div>
</template>

<script>
import DropdownMenu from '#ui/components/DropdownMenu';
import DropdownMenuItem from '#ui/components/DropdownMenuItem';
import DropdownMenuDivider from '#ui/components/DropdownMenuDivider';
import TextInput from '#ui/components/TextInput';
import PaginationRow from '#ui/components/PaginationRow';

export default {
  name: 'ComponentsPage',

  components: {
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuDivider,
    TextInput,
    PaginationRow,
  },

  data: () => ({
    textInputValue: '',
    smallTextInputValue: '',
  }),

  methods: {
    logConsole() {
      // eslint-disable-next-line no-console
      console.log('Log console!');
    },
  },
};
</script>

<style scoped>
.buttons-row button {
  @apply mr-2;
}
</style>
