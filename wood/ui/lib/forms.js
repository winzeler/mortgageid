const { get, isObject, isEmpty: isEmptyArray } = require('lodash');
const { isEmpty: isEmptyString } = require('validator');
const { valueOf } = require('#lib/valueOf');

/**
 * Extracts the titles from an array of errors and joins them by a <br>.
 *
 * @param {array} errors - The errors to extract the titles from.
 *
 * @return {String}
 */
function getErrorTitleString(errors) {
  return errors.map((error) => error.title).join('<br>');
}

/**
 * Computed helper to make it easy to get field error text.
 *
 * @param {String} field - The name of the field to get error text for.
 * @param {Validator} validator - The validator to use.
 * @param {Object} form - The form or form name to check.
 * @param {Object} apiErrors - The api errors or api errors object name to check.
 *
 * @return {String}
 */
function fieldErrorText(field, validator, formParam, apiErrorsParam) {
  return function () { // eslint-disable-line func-names
    const form = isObject(formParam)
      ? formParam
      : get(this, formParam || 'form');
    const apiErrors = isObject(apiErrorsParam)
      ? apiErrorsParam
      : get(this, apiErrorsParam || 'apiErrors');

    if (isEmptyFormField(form, field) && isEmptyApiErrors(apiErrors, field)) {
      return '';
    }

    return getErrorTitleString(validator.errors(form, apiErrors, field));
  };
}

/**
 * Check if a form field's value is empty.
 *
 * @param {Object} form  - The form to check.
 * @param {string} field - The field key to check.
 *
 * @return {Boolean}
 */
function isEmptyFormField(form, field) {
  return isEmptyString(valueOf(form[field]));
}

/**
 * Check if API errors for a field are empty.
 *
 * @param {object} apiErrors - The API errors to check.
 * @param {string} field - The field key to check.
 *
 * @return {Boolean}
 */
function isEmptyApiErrors(apiErrors, field) {
  return isEmptyArray(valueOf(get(apiErrors, field, [])));
}

/**
 * Applies the results of validation to an apiErrors ref object.
 *
 * @param {Aarray} apiErrors - The API errors to apply to.
 * @param {Array} errors - The errors to apply.
 */
function applyErrors(apiErrors, errors) {
  Object.keys(errors).forEach((key) => {
    apiErrors[key].value = errors[key];
  });
}

module.exports = {
  getErrorTitleString,
  fieldErrorText,
  applyErrors,
};
