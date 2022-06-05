const { difference } = require('lodash');
const { Model } = require('#lib/Model');
const { FieldString, FieldCustom } = require('#lib/Fields');
const { getConfig } = require('#lib/Config');

/**
 * @type {Object} Field configuration.
 */
const ROLE_MODEL_FIELDS = {
  name: new FieldString({ label: 'Name' }),
  // An array of just the names of the permissions this role has
  permissionsNames: new FieldCustom({
    label: 'Permissions',
    valueFn: (rolePermissions) => rolePermissions.map((permission) => getConfig('teams', 'permissions')[permission].name),
  }),
  // An array of the full permission objects (name, description) this role has
  permissionsObjects: new FieldCustom({
    label: 'Permissions',
    valueFn: (rolePermissions) => rolePermissions.map((permission) => getConfig('teams', 'permissions')[permission]),
  }),
};

class RoleModel extends Model {
  /**
   * Constructor.
   *
   * @param {String} id - The id of this role.
   */
  constructor({ id } = {}) {
    super(ROLE_MODEL_FIELDS);

    const roles = getConfig('teams', 'roles');

    this.id = id;
    this.name = roles[id].name;
    this.description = roles[id].description;
    this.permissions = roles[id].permissions;
  }

  /**
   * Convert model to JSON.
   *
   * @return {Object}
   */
  toJSON() {
    return {
      id: this.id,
    };
  }

  /**
   * If this role has the provided permissions.
   *
   * @param {Array<String>} checkPermissions - The permissions to check.
   *
   * @return {Boolean}
   */
  hasPermissions(checkPermissions) {
    // difference will provide the list of required permissions not in this role's permissions
    return difference(checkPermissions, this.permissions).length === 0;
  }
}

module.exports = {
  RoleModel,
  ROLE_MODEL_FIELDS,
};
