<template>
  <div>
    <select
      :value="modelValue"
      class="w-full"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option value="">
        Select a role
      </option>
      <option
        v-for="(role, roleId) in roles"
        :key="roleId"
        :value="roleId"
      >
        {{ role.name }}
      </option>
    </select>

    <div class="mt-2 mb-4">
      {{ selectedRole.description }}
    </div>

    <div v-if="modelValue">
      <div class="mt-4 mb-2 font-bold text-lg">
        Permissions:
      </div>
      <div
        v-for="(permission, permissionId) in selectedPermissions"
        :key="permissionId"
      >
        <span class="font-bold">{{ permission.name }}:</span> {{ permission.description }}
      </div>
    </div>
  </div>
</template>

<script>
import isEmpty from 'lodash/isEmpty';
import pick from 'lodash/pick';
import get from 'lodash/get';
import { getConfig } from '#lib/Config';

export default {
  name: 'RolePicker',

  props: {
    /**
     * @type {String} The value of the role select input.
     */
    modelValue: {
      type: String,
      default: '',
    },
  },

  emits: ['update:modelValue'],

  computed: {
    /**
     * The currently-selected role.
     *
     * @return {Object}
     */
    selectedRole() {
      return get(getConfig('teams', 'roles'), this.modelValue, {});
    },

    /**
     * The available roles to choose form.
     *
     * @return {Object}
     */
    roles() {
      return getConfig('teams', 'roles');
    },

    /**
     * The permissions available to the currently-selected role.
     *
     * @return {Array}
     */
    selectedPermissions() {
      const list = pick(getConfig('teams', 'permissions'), get(this.selectedRole, 'permissions', []));
      return isEmpty(list) ? [{
        name: 'Default Permissions',
        description: 'Default application access.',
      }] : list;
    },
  },
};
</script>
