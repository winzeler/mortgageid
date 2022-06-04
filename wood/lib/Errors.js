/* eslint-disable max-classes-per-file */

const { get } = require('lodash');
const { getConfig } = require('#lib/Config');

/**
 * An error that can be safely and sanely extended to errors with other names.
 */
class ExtendableError extends Error {
  constructor(message, error = null) {
    super(message);

    if (error) {
      this.stack = error.stack;
    }
    else if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
    else {
      this.stack = (new Error(message)).stack;
    }
  }
}

/**
 * An error indicating a resource could not be found.
 */
class NotFoundError extends ExtendableError {
  constructor(message, error = null) {
    super(message, error);
    this.name = 'NotFoundError';
  }
}

/**
 * An error indicating that the request is out of allowable ranges.
 */
class OutOfRangeError extends ExtendableError {
  constructor(message, error = null) {
    super(message, error);
    this.name = 'OutOfRangeError';
  }
}

/**
 * An error from Stripe that must be handled specially.
 */
class StripeError extends ExtendableError {
  constructor(message, error = null) {
    super(message, error);
    this.name = 'StripeError';
  }
}

/**
 * A standardized 400 error.
 * Caught and displayed in a standard way in the application error handler.
 */
class Standard400Error extends ExtendableError {
  /**
   * Constructor.
   *
   * @param {Object} errors - An errors array that is safe to display as an API response.
   * @param {Error} error - A parent error to associate, if any.
   */
  constructor(errors, { error } = {}) {
    super('400 - Bad Request', error);
    this.errors = errors;
    this.name = 'Standard400Error';
    this.httpCode = 400;
  }

  /**
   * Convert this error to a JSON representation used for displaying in forms.
   *
   * @return {Object}
   */
  toJSON() {
    return {
      errors: this.errors,
    };
  }
}

/**
 * A standardized 401 Unauthorized error.
 * Caught and displayed in a standard way in the application error handler.
 */
class Standard401Error extends ExtendableError {
  /**
   * Constructor.
   *
   * @param {Object} errors - An errors array that is safe to display as an API response.
   * @param {Error} error - A parent error to associate, if any.
   */
  constructor(errors, { error, redirectTo } = {}) {
    super('401 - Unauthorized', error);
    this.errors = errors;
    this.name = 'Standard401Error';
    this.httpCode = 401;
    this.redirectTo = redirectTo || '/login';
  }

  /**
   * Convert this error to a JSON representation used for displaying in forms.
   *
   * @return {Object}
   */
  toJSON() {
    return {
      errors: this.errors,
      redirect_to: this.redirectTo,
    };
  }
}

/**
 * A standardized 402 Payment Required error.
 * Caught and displayed in a standard way in the application error handler.
 */
class Standard402Error extends ExtendableError {
  /**
   * Constructor.
   *
   * @param {Object} errors - An errors array that is safe to display as an API response.
   * @param {Error} error - A parent error to associate, if any.
   */
  constructor(errors, { error } = {}) {
    super('402 - Payment Required', error);
    this.errors = errors;
    this.name = 'Standard402Error';
    this.httpCode = 402;
  }

  /**
   * Convert this error to a JSON representation used for displaying in forms.
   *
   * @return {Object}
   */
  toJSON() {
    return {
      errors: this.errors,
    };
  }
}

/**
 * A standardized 403 Forbidden error.
 * Caught and displayed in a standard way in the application error handler.
 */
class Standard403Error extends ExtendableError {
  /**
   * Constructor.
   *
   * @param {Object} errors - An errors array that is safe to display as an API response.
   * @param {Error} error - A parent error to associate, if any.
   */
  constructor(errors, { error } = {}) {
    super('403 - Forbidden', error);
    this.errors = errors;
    this.name = 'Standard403Error';
    this.httpCode = 403;
  }

  /**
   * Convert this error to a JSON representation used for displaying in forms.
   *
   * @return {Object}
   */
  toJSON() {
    return {
      errors: this.errors,
    };
  }
}

/**
 * A standardized 404 Not Found error.
 * Caught and displayed in a standard way in the application error handler.
 */
class Standard404Error extends ExtendableError {
  /**
   * Constructor.
   *
   * @param {Object} errors - An errors array that is safe to display as an API response.
   * @param {Error} error - A parent error to associate, if any.
   */
  constructor(errors, { error } = {}) {
    super('404 - Not Found', error);
    this.errors = errors;
    this.name = 'Standard404Error';
    this.httpCode = 404;
  }

  /**
   * Convert this error to a JSON representation used for displaying in forms.
   *
   * @return {Object}
   */
  toJSON() {
    return {
      errors: this.errors,
    };
  }
}

/**
 * Gets an error message from an error.  Attempts to retrieve error message from response, but if
 * the error comes from some other source (coding error, etc), it will log the error and return
 * the provided default message to the user.
 *
 * @param {Error} error - The error to get the message from.
 * @param {String} defaultMessage - A default message to use if the error does not have a response.
 *
 * @return {String}
 */
function getErrorMessage(error, defaultMessage) {
  if (get(error, 'response.body.errors', false)) {
    return get(error, 'response.body.errors', [])
      .map((errorEntry) => errorEntry.title)
      .join('<br>');
  }

  console.error(error); // eslint-disable-line no-console

  return defaultMessage || getConfig('app', 'defaultErrorMessage');
}

module.exports = {
  ExtendableError,
  NotFoundError,
  OutOfRangeError,
  StripeError,

  Standard400Error,
  Standard401Error,
  Standard402Error,
  Standard403Error,
  Standard404Error,

  Standard4xxErrors: [
    'Standard400Error',
    'Standard401Error',
    'Standard402Error',
    'Standard403Error',
    'Standard404Error',
  ],

  getErrorMessage,

  // Field is empty and shouldn't be
  ERROR_EMPTY: 'ERROR_EMPTY',

  // Field is not a valid email address format
  ERROR_INVALID_EMAIL: 'ERROR_INVALID_EMAIL',

  // Field is not a valid integer
  ERROR_INVALID_INTEGER: 'ERROR_INVALID_INTEGER',

  // Field is not a valid date.
  ERROR_INVALID_DATE: 'ERROR_INVALID_DATE',

  // Field is not a valid phone number.
  ERROR_INVALID_PHONE: 'ERROR_INVALID_PHONE',

  // Field should match another field (check meta)
  ERROR_MATCH_FIELD: 'ERROR_MATCH_FIELD',

  // Field does not satisfy minimum length (check meta)
  ERROR_MIN_LENGTH: 'ERROR_MIN_LENGTH',

  // Field does not satisfy maximum length (check meta)
  ERROR_MAX_LENGTH: 'ERROR_MAX_LENGTH',

  // Field is not in expected list (check meta)
  ERROR_NOT_IN_LIST: 'ERROR_NOT_IN_LIST',

  // Field should be unique in DB but isn't
  ERROR_UNIQUE: 'ERROR_UNIQUE',

  // Record could not be found
  ERROR_NOT_FOUND: 'ERROR_NOT_FOUND',

  // User is not authorized to access the requested resource
  ERROR_NOT_AUTHORIZED: 'ERROR_NOT_AUTHORIZED',

  // Payment is required to access this feature
  ERROR_PAYMENT_REQUIRED: 'ERROR_PAYMENT_REQUIRED',

  // Stripe error message
  ERROR_STRIPE_ERROR: 'ERROR_STRIPE_ERROR',

  // Payload to larger than bodyParser allows
  ERROR_PAYLOAD_TOO_LARGE: 'ERROR_PAYLOAD_TOO_LARGE',

  // Could not parse JSON payload
  ERROR_COULD_NOT_PARSE_JSON: 'ERROR_COULD_NOT_PARSE_JSON',

  // Could not modify user on another team
  ERROR_INVALID_TEAM: 'ERROR_INVALID_TEAM',

  // Cannot modify own team membership
  ERROR_TEAM_SELF: 'ERROR_TEAM_SELF',

  // User has been removed from team
  ERROR_NOT_ON_TEAM: 'ERROR_NOT_ON_TEAM',

  // User is already on team, cannot be added again
  ERROR_ALREADY_ON_TEAM: 'ERROR_ALREADY_ON_TEAM',

  // Cannot invite more team members than subscription limit allows
  ERROR_INVITE_MAX_MEMBERS: 'ERROR_INVITE_MAX_MEMBERS',

  // - Postgres errors -----------------------------------------------------------------------------

  POSTGRES_ERROR_UNIQUE_VIOLATION: '23505',
};
