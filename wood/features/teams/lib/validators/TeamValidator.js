const { Validator } = require('#lib/Validator');
const { Rule } = require('#lib/Rules');
const { ERROR_EMPTY } = require('#lib/Errors');
const { getLanguageString } = require('#lib/Config');

// Rules use the validator.js library to validate strings from your forms.
// For documentation about Nodewood Validators, visit: https://nodewood.com/docs/architecture/validators/
// For documentation about the validator.js library, visit: https://www.npmjs.com/package/validator

class TeamValidator extends Validator {
  constructor(...args) {
    super(...args);

    this.rules = {
      name: [
        new Rule('isEmpty', {
          code: ERROR_EMPTY,
          title: getLanguageString('teams', 'emptyTeamNameError'),
        }),
      ],
    };
  }
}

module.exports = {
  TeamValidator,

  TEAM_VALIDATOR_FORM_FIELDS: [
    'name',
  ],

  FORM_FIELDS_TEAM_NAME_OPTIONAL: [],

  ADMIN_TEAM_EDIT_FORM_FIELDS: [
    'name',
  ],
};
