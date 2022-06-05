const { Service } = require('#api/Service');
const { CreditModel } = require('#features/credit/lib/models/CreditModel');

// `this.table(tx)` returns the credits table for use in MassiveJS functions:
// For documentation about Nodewood Services, visit: https://nodewood.com/docs/api/services/
// For documentation about MassiveJS, visit: https://massivejs.org/docs/queries

class CreditsService extends Service {
  /**
   * The constructor.
   *
   * @param {MassiveJS} db - The database to use to create the credit.
   * @param {Nodemailer} mailer - The mailer to use to send mail.
   */
  constructor({ db, mailer }) {
    super({ db, mailer });
    this.model = CreditModel;
  }

  /**
   * Gets a page of credits based on search query.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {String} search - The text to search for, either in name or email.
   * @param {Object} order - The order to sort the search page.
   * @param {Number} page - The page of credits to get.
   * @param {Number} per - The number of credits to get per page.
   *
   * @return {Array<CreditModel>}
   */
  async getSearchPage(tx, { search, order, page, per } = {}) {
    const query = search
      ? { 'name ilike': `%${search}%` }
      : {};

    return this.findBy(tx, query, { page, per, order });
  }
}

module.exports = {
  CreditsService,
};
