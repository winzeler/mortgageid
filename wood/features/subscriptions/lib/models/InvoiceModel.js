const moment = require('moment');
const { Model } = require('#lib/Model');
const { FieldString, FieldDate, FieldEnum } = require('#lib/Fields');
const { currencyFormat } = require('#lib/Text');

/**
 * @type {Object} Field configuration.
 */
const INVOICE_MODEL_FIELDS = {
  id: new FieldString({ label: 'ID' }),
  created: new FieldDate({ label: 'Created', dateFormat: 'MMMM D YYYY' }),
  invoicePdf: new FieldString({ label: 'PDF' }),
  status: new FieldEnum({
    label: 'Status',
    enumList: {
      draft: 'Draft',
      open: 'Open',
      paid: 'Paid',
      uncollectible: 'Uncollectible',
      void: 'Void',
    },
  }),
  total: new FieldString({ label: 'Total' }),
};

class InvoiceModel extends Model {
  /**
   * Constructor.
   *
   * @param {Number} id - The Stripe ID of this invoice.
   * @param {Number} created - The timestamp for when this invoice was created.
   * @param {String} currency  - The currency of the invoice.
   * @param {String} invoice_pdf - The link to download the PDF for the invoice.
   * @param {String} status - The status of the invoice.
   * @param {Number} total - The total price paid on this invoice, in cents.
   */
  constructor({ id, created, currency, invoice_pdf, status, total } = {}) {
    super(INVOICE_MODEL_FIELDS);

    this.id = id;
    this.created = moment.unix(created).utc();
    this.currency = currency.toUpperCase();
    this.invoicePdf = invoice_pdf;
    this.status = status;
    this.total = currencyFormat(total, currency);
    this.originalTotal = total;
  }

  /**
   * Convert model to JSON.
   *
   * @return {Object}
   */
  toJSON() {
    return {
      id: this.id,
      created: this.created.unix(),
      currency: this.currency.toLowerCase(),
      invoice_pdf: this.invoicePdf,
      status: this.status,
      total: this.originalTotal,
    };
  }
}

module.exports = {
  InvoiceModel,
  INVOICE_MODEL_FIELDS,
};
