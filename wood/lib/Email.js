const { isUndefined, get } = require('lodash');
const { renderFile } = require('ejs');
const logger = require('pino')({ level: process.env.LOG_LEVEL || 'info' });

/**
 * Add a body to the mail options.
 *
 * Template + data takes precedence over html, while text can be added independantly.
 *
 * @param {Object} mailOptions - The mail options to modify with body fields.
 * @param {String} template - A path to the EJS template to use to create the body.
 * @param {Object} data - Data to use to populate the EJS template.
 * @param {String} html - HTML to use for the body.
 * @param {String} text - Text to use for the body.
 */
async function addBody(mailOptions, template, data, html, text) {
  if (! isUndefined(template) && ! isUndefined(data)) {
    mailOptions.html = await renderFile(template, data, { async: true });
  }
  else if (! isUndefined(html)) {
    mailOptions.html = html;
  }

  if (! isUndefined(text)) {
    mailOptions.text = text;
  }

  return mailOptions;
}

/**
 * Send an email.
 *
 * @param {Nodemailer} mailer - The mailer to use.
 * @param {String} from - The email address to send from.
 * @param {String} to - The email address to send to.
 * @param {String} subject - The subject line for the email.
 * @param {String} template - A path to the EJS template to use to create the body.
 * @param {Object} data - Data to use to populate the EJS template.
 * @param {String} html - HTML to use for the body.
 * @param {String} text - Text to use for the body.
 *
 * @return {Object}
 */
async function sendMail(mailer, {
  from,
  to,
  subject,
  template,
  data,
  html,
  text,
}) {
  const mailOptions = await addBody({ from, to, subject }, template, data, html, text);
  const mailResponse = await mailer.sendMail(mailOptions);

  // If user has not configured mailer yet, log mail response
  if (get(mailer, 'options.jsonTransport', false)) {
    logger.info('Mailer not configured.  Email contents:');
    logger.info(mailResponse);
  }

  return mailResponse;
}

module.exports = {
  sendMail,
};
