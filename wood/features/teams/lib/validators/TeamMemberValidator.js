const { Validator } = require('#lib/Validator');
const { Rule, NotRule } = require('#lib/Rules');
const {
  ERROR_EMPTY,
  ERROR_INVALID_EMAIL,
  ERROR_NOT_IN_LIST,
} = require('#lib/Errors');
const { getConfig } = require('#lib/Config');

// Rules use the validator.js library to validate strings from your forms.
// For documentation about Nodewood Validators, visit: https://nodewood.com/docs/architecture/validators/
// For documentation about the validator.js library, visit: https://www.npmjs.com/package/validator

class TeamMemberValidator extends Validator {
  constructor(...args) {
    super(...args);

    this.rules = {
      email: [
        new Rule('isEmpty', { code: ERROR_EMPTY, title: 'You must enter an email address.' }),
        new NotRule('isEmail', { code: ERROR_INVALID_EMAIL, title: 'You must enter a valid email address.' }),
      ],
      name: [
        new Rule('isEmpty', { code: ERROR_EMPTY, title: 'You must enter a name.' }),
      ],
      role: [
        new NotRule(this.roleInList, {
          code: ERROR_NOT_IN_LIST,
          title: 'You must select a valid role.',
          meta: { list: Object.keys(getConfig('teams', 'roles')) },
        }),
      ],
    };
  }

  /**
   * Validates if provided role is in the list of valid roles.
   *
   * @param {String} role - The role to check.
   *
   * @return {Boolean}
   */
  roleInList(role) {
    return Object.keys(getConfig('teams', 'roles')).includes(role);
  }
}

module.exports = {
  TeamMemberValidator,

  TEAM_MEMBER_VALIDATOR_FORM_FIELDS: [
    'email',
    'name',
    'role',
  ],

  UPDATE_ROLE_FIELDS: [
    'role',
  ],
};
