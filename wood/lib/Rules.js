/* eslint-disable max-classes-per-file */

const { get, isUndefined, isFunction } = require('lodash');
const validator = require('validator');
const { valueOf } = require('#lib/valueOf');

/**
 * Used to set up validators.  Check https://www.npmjs.com/package/validator for names of
 * validators to use for your rules.
 */
class Rule {
  /**
   * Constructor.
   *
   * @param {Function|String} name - The name of the validator to use to test the field.
   *                                 Alternatively, a custom validator function can be used.
   * @param {Function|Object} error - The parameters to pass to the error, if this rule fails.
   *                                  Alternatively, a custom function can be used.
   * @param {Object} args - Arguments to use to modify the validator.
   */
  constructor(name, error, args = []) {
    this.name = name;
    this.validator = isFunction(name)
      // An explicitly-provided function
      ? name
      // Use local overrides if they exist
      : get(this, name, get(validator, name, false));

    if (! this.validator) {
      throw new Error(`${name} is not a valid validator: https://www.npmjs.com/package/validator`);
    }

    this.error = error;
    this.args = args;
    this.form = {};

    this.negate = false;
  }

  /**
   * Validates this rule agains the form.
   *
   * Unless the rule is specifically checking if the field is empty, skip all empty or undefined
   * fields.  This allows for fields to be empty sometimes, but have validation run against them if
   * they are filled in.
   *
   * @param {String} field - The field this rule is being run against.
   * @param {Object} form - The form data to use to validate.
   *
   * @return {Object}
   */
  validate(field, form) {
    const value = valueOf(form[field]);

    // Skip empty fields, unless the rule is explicitly checking to see if they are empty
    if (this.name !== 'isEmpty' && (isUndefined(value) || validator.isEmpty(value))) {
      return null;
    }

    this.form = form;
    const passes = this.validator(this.stringify(value), ...this.args);

    if (this.negate ? ! passes : passes) {
      return isFunction(this.error) ? this.error() : this.error;
    }

    return null;
  }

  /**
   * Validator functions expect only strings, so we have to convert them before passing.  Undefined
   * converts naively to 'undefined' though, which won't trigger isEmpty or other similar validators
   * correctly, so we special-case it.
   *
   * @param {Mixed} value - The value to convert.
   *
   * @return {String}
   */
  stringify(value) {
    return isUndefined(value) ? '' : String(value);
  }

  /**
   * Check to see if a field is equal to another field in the form.
   *
   * @param {String} str - The string to compare.
   * @param {String} comparisonField - The field in the form to compare it to.
   *
   * @return {Boolean}
   */
  equalsField(str, comparisonField) {
    return validator.equals(str, this.form[comparisonField]);
  }
}

class NotRule extends Rule {
  /**
   * Constructor.
   *
   * @param {String} name - The name of the validator to use to test the field.
   * @param {Object} error - The parameters to pass to the error, if this rule fails.
   * @param {Object} args - Arguments to use to modify the validator.
   */
  constructor(name, error, args = []) {
    super(name, error, args);

    this.negate = true;
  }
}

module.exports = {
  Rule,
  NotRule,
};
