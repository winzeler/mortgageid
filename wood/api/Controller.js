const { isArray, isEmpty } = require('lodash');
const express = require('express');
const { ListRequestValidator } = require('#api/ListRequestValidator');
const { Standard400Error } = require('#lib/Errors');

module.exports.Controller = class Controller {
  /**
   * Constructor.
   *
   * @param {MassiveJS} db - The MassiveJS db connection.
   * @param {Mailer} mailer - The mailer.
   */
  constructor({ db, mailer } = {}) {
    this.db = db;
    this.mailer = mailer;
    this.router = express.Router();
    this.listRequestValidator = new ListRequestValidator();
    this.prefix = '/api';
  }

  /**
   * Perform a function inside a transaction.
   *
   * @param {Function} callback - A callback containing database functionality.
   *
   * @return {Transaction}
   */
  async withTransaction(callback) {
    return this.db.withTransaction(callback);
  }

  /**
   * Converts from { email: ['error'] } to JSON API error objects array.
   * (https://jsonapi.org/format/1.1/#error-objects)
   *
   * @param  {Object} errors - The form errors to convert.
   *
   * @return {Array}
   */
  toJsonApiErrorObjects(errors) {
    return Object.keys(errors).map(
      (parameter) => errors[parameter].map((error) => ({ source: { parameter }, ...error })),
    ).flat();
  }

  /**
   * Validate a request.
   *
   * @param {Object} form - The form to validate (can be Request body, query, etc).
   * @param {Validator|Array} validator - One or more configured, instantiated Validators.
   */
  validate(form, validator) {
    if (isArray(validator)) {
      const errors = {};

      validator.forEach((instance) => {
        if (! instance.valid(form)) {
          Object.assign(errors, instance.errors(form, {}));
        }
      });

      if (! isEmpty(errors)) {
        throw new Standard400Error(this.toJsonApiErrorObjects(errors));
      }
    }
    else if (! validator.valid(form)) {
      throw new Standard400Error(this.toJsonApiErrorObjects(validator.errors(form, {})));
    }
  }
};
