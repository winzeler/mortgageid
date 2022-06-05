const { Service } = require('#api/Service');
const { ReportModel } = require('#features/credit/lib/models/ReportModel');

// `this.table(tx)` returns the reports table for use in MassiveJS functions:
// For documentation about Nodewood Services, visit: https://nodewood.com/docs/api/services/
// For documentation about MassiveJS, visit: https://massivejs.org/docs/queries

class ReportsService extends Service {
  /**
   * The constructor.
   *
   * @param {MassiveJS} db - The database to use to create the report.
   * @param {Nodemailer} mailer - The mailer to use to send mail.
   */
  constructor({ db, mailer }) {
    super({ db, mailer });
    this.model = ReportModel;
  }

  /**
   * Gets a page of reports based on search query.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {String} search - The text to search for, either in name or email.
   * @param {Object} order - The order to sort the search page.
   * @param {Number} page - The page of reports to get.
   * @param {Number} per - The number of reports to get per page.
   *
   * @return {Array<ReportModel>}
   */
  async getSearchPage(tx, { search, order, page, per } = {}) {
    const query = search
      ? { 'name ilike': `%${search}%` }
      : {};

    return this.findBy(tx, query, { page, per, order });
  }
}

module.exports = {
  ReportsService,
};
