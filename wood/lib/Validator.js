const { fromPairs, get, concat, uniqBy, zipObject, invert } = require('lodash');
const { valueOf } = require('#lib/valueOf');

class Validator {
  /**
   * Constructor.
   *
   * @param {Array<String>} fields - A list of fields to validate for this form.
   * @param {Object} aliases - A list of aliases, for when field names do not match rule names.
   *
   * Alias keys should be the field name, and alias values are the rule to execute.
   *
   * Example: `{ aliases: { team_name: 'name' } }`
   */
  constructor(fields, { aliases = {} } = {}) {
    this.fields = fields;
    this.form = {};
    this.apiErrors = {};
    this.aliases = aliases;
  }

  /**
   * If the form is valid.
   *
   * Ignore apiErrors in this, because you will frequently want to continue to show api errors
   * (duplicate user name), but allow the user to resubmit the form.
   *
   * @param {Object} form - The form to examine.
   *
   * @return {Boolean}
   */
  valid(form) {
    return Object.keys(this.errors(form, {})).length === 0;
  }

  /**
   * Errors arising from an invalid form.
   *
   * @param {Object} form - The form to examine.
   * @param {Object} apiErrors - The apiErrors to incorporate.
   * @param {String} specificField - A specific field to check, if not the whole form.
   *
   * @return {Object}
   */
  errors(form, apiErrors, specificField = false) {
    // Save form, apiErrors for use in validators/rules.
    this.form = form;
    this.apiErrors = apiErrors;

    return specificField
      ? this.getErrorsForField(specificField)
      : this.getErrorsForForm();
  }

  /**
   * Gets the errors for just one field.
   *
   * @param {String} field - The field to get errors for.
   *
   * @return {Array}
   */
  getErrorsForField(field) {
    return uniqBy(concat(
      this.getFirstFailingRule(field),
      valueOf(get(this.apiErrors, field, [])),
    ), 'code');
  }

  /**
   * Gets the errors for the entire form.
   *
   * @return {Object}
   */
  getErrorsForForm() {
    const rulesErrorArray = this.fields.map(
      (field) => [this.getAliasFor(field), this.getFirstFailingRule(field)],
    );

    const errors = fromPairs(rulesErrorArray.filter(([key, error]) => error.length));

    // Merge apiErrors into validator errors
    Object.keys(this.apiErrors).forEach((key) => {
      const fieldErrors = get(errors, key, []);
      const apiErrors = valueOf(this.apiErrors[key]);

      if (apiErrors.length) {
        errors[key] = concat(fieldErrors, apiErrors);
      }
    });

    return this.uniqueErrors(errors);
  }

  /**
   * Creates a error object that is free of duplicate errors, by removing errors with duplicate
   * code properties.
   *
   * Error objects may have duplicate errors if API errors are being concatenated with form
   * errors.  Usually, you should prevent a user from submitting a form until the form values are
   * valid, but some cases may require for the error handling to happen exclusively on the server.
   *
   * @param {Object} errors - The errors to de-duplicate
   *
   * @return {Object}
   */
  uniqueErrors(errors) {
    const keys = [];
    const values = [];

    Object.entries(errors).forEach(([key, value]) => {
      keys.push(key);
      values.push(uniqBy(value, 'code'));
    });

    return zipObject(keys, values);
  }

  /**
   * Gets the first failing rule for the provided field.
   *
   * @param {String} field - The field to get the errors for.
   *
   * @return {Array<Object>}
   */
  getFirstFailingRule(field) {
    const ruleName = this.getFieldFor(field);

    if (! get(this.rules, ruleName)) {
      throw new Error(`No rules have been defined for ${ruleName} in validator.`);
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const rule of this.rules[ruleName]) {
      const errorObj = rule.validate(this.getAliasFor(field), this.form);
      if (errorObj) {
        return [errorObj];
      }
    }

    return [];
  }

  /**
   * Gets the alias for a field, if set.
   *
   * @param {String} field - The name of the field to get the alias for.
   *
   * @return {String} - The field's alias, or the field if no alias set.
   */
  getAliasFor(field) {
    return get(invert(this.aliases), field, field);
  }

  /**
   * Gets the field that an alias refers to, if set.
   *
   * @param {String} alias - The alias to get the field for.
   *
   * @return {String} - The aliased field name.
   */
  getFieldFor(alias) {
    return get(this.aliases, alias, alias);
  }
}

module.exports = {
  Validator,
};
