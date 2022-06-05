const moment = require('moment');
const { Model } = require('#lib/Model');
const { FieldString, FieldCustom } = require('#lib/Fields');
const { RoleModel } = require('#features/teams/lib/models/RoleModel');
const { getConfig } = require('#lib/Config');

/**
 * @type {Object} Field configuration.
 */
const TEAM_INVITE_MODEL_FIELDS = {
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
class TeamInviteModel extends Model {
  /**
   * Constructor.
   *
   * @param {Number} id - The ID of this user.
   * @param {String} name - The full name of this user.
   * @param {String} email - The email address of this user.
   * @param {String} role - The ID of the user's role.
   * @param {Number} team_id - The ID of the team this invite is for.
   * @param {Number} created_at - The date this invite was created.
   */
  constructor({ id, name, email, role, team_id, created_at } = {}) {
    super(TEAM_INVITE_MODEL_FIELDS);

    this.id = id;
    this.name = name;
    this.email = email;
    this.role = new RoleModel({ id: role });
    this.teamId = team_id;
    this.isExpired = moment().isAfter(moment(created_at).add(...getConfig('teams', 'inviteExpiry')));
  }

  /**
   * Convert model to JSON.
   *
   * @return {Object}
   */
  toJSON() {
    return {
      name: this.name,
      email: this.email,
      role: this.role.id,
    };
  }
}

module.exports = {
  TeamInviteModel,
  TEAM_INVITE_MODEL_FIELDS,
};
