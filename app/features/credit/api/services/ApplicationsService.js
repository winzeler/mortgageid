const { Service } = require('#api/Service');
const { ApplicationModel } = require('#features/credit/lib/models/ApplicationModel');

// `this.table(tx)` returns the applications table for use in MassiveJS functions:
// For documentation about Nodewood Services, visit: https://nodewood.com/docs/api/services/
// For documentation about MassiveJS, visit: https://massivejs.org/docs/queries

class ApplicationsService extends Service {
  /**
   * The constructor.
   *
   * @param {MassiveJS} db - The database to use to create the application.
   * @param {Nodemailer} mailer - The mailer to use to send mail.
   */
  constructor({ db, mailer }) {
    super({ db, mailer });
    this.model = ApplicationModel;
  }

  /**
   * Gets a page of applications based on search query.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {String} search - The text to search for, either in name or email.
   * @param {Object} order - The order to sort the search page.
   * @param {Number} page - The page of applications to get.
   * @param {Number} per - The number of applications to get per page.
   *
   * @return {Array<ApplicationModel>}
   */
  async getSearchPage(tx, { search, order, page, per } = {}) {
    const query = search
      ? { 'name ilike': `%${search}%` }
      : {};

    return this.findBy(tx, query, { page, per, order });
  }
}

module.exports = {
  ApplicationsService,
};
