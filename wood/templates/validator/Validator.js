const { Validator } = require('#lib/Validator');
const { Rule } = require('#lib/Rules');
const { ERROR_EMPTY } = require('#lib/Errors');

// Rules use the validator.js library to validate strings from your forms.
// For documentation about Nodewood Validators, visit: https://nodewood.com/docs/architecture/validators/
// For documentation about the validator.js library, visit: https://www.npmjs.com/package/validator

class ###_PASCAL_NAME_###Validator extends Validator {
  constructor(...args) {
    super(...args);

    this.rules = {
      name: [
        new Rule('isEmpty', { code: ERROR_EMPTY, title: 'You must enter a name.' }),
      ],
    };
  }
}

module.exports = {
  ###_PASCAL_NAME_###Validator,

  ###_UPPER_SNAKE_NAME_###_FORM_FIELDS: [
    'name',
  ],
};
