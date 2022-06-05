const { isObject } = require('lodash');

/**
 * Returns the value of a variable.  Useful if not sure if running in Vue context.
 *
 * If the variable is a RefImpl, returns its .value.  Otherwise, just returns the variable.
 *
 * @param {Mixed} value - The variable to get the value of.
 *
 * @return {Mixed}
 */
function valueOf(value) {
  return isRefImpl(value) ? value.value : value;
}

/**
 * Identifies if the provided value is a RefImpl.
 *
 * Can't check constructor name, since minimizer could rename it.  But all RefImpls will have a
 * __v_isRef property, which can be checked for.
 *
 * @param {Mixed} value - The value to check.
 *
 * @return {Boolean}
 */
function isRefImpl(value) {
  return isObject(value) && Object.prototype.hasOwnProperty.call(value, '__v_isRef');
}

module.exports = {
  valueOf,
};
