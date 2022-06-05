const { Controller } = require('#api/Controller');

module.exports.PublicController = class PublicController extends Controller {
  /**
   * Constructor.
   *
   * @param {MassiveJS} db - The MassiveJS db connection.
   * @param {Mailer} mailer - The mailer.
   */
  constructor({ db, mailer }) {
    super({ db, mailer });

    this.prefix = '/api/public';
  }
};
