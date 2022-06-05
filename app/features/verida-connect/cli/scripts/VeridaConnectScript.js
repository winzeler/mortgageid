const { get } = require('lodash');
const { log } = require('#cli/Log');

/**
 * Run the script.
 *
 * @param {Array} scriptArgs - The arguments passed to the script.
 * @param {Object} options - The options passed to the script.
 * @param {Massive} db - A database instance.
 * @param {Nodemailer} mailer - A mailer instance.
 */
async function run(scriptArgs, options, { db, mailer }) {
  log('log', 'Script successful.', get(options, 'format'));
  return { scriptArgs, options, db, mailer };
}

module.exports = { run };
