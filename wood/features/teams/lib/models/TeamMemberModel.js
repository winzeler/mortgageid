const { Model } = require('#lib/Model');
const { FieldString, FieldCustom } = require('#lib/Fields');
const { RoleModel } = require('#features/teams/lib/models/RoleModel');

/**
 * @type {Object} Field configuration.
 */
const TEAM_MEMBER_MODEL_FIELDS = {
  name: new FieldString({ label: 'Name', desktopLabelClasses: ['text-left'] }),
  role: new FieldCustom({
    label: 'Role',
    valueFn: (value) => value.name,
    desktopLabelClasses: ['text-left'],
  }),
};

/**
 * Subset of user model that is used to display entries on the Team Member list.
 */
class TeamMemberModel extends Model {
  /**
   * Constructor.
   *
   * @param {Number} id - The ID of this user.
   * @param {String} name - The full name of this user.
   * @param {String} email - The email address of this user.
   * @param {String} role - The ID of the user's role.
   */
  constructor({ id, name, email, role } = {}) {
    super(TEAM_MEMBER_MODEL_FIELDS);

    this.id = id;
    this.name = name;
    this.email = email;
    this.role = new RoleModel({ id: role });
  }

  /**
   * Convert model to JSON.
   *
   * @return {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role.id,
    };
  }
}

module.exports = {
  TeamMemberModel,
  TEAM_MEMBER_MODEL_FIELDS,
};
