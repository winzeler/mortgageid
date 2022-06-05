/* eslint-disable no-console */

/**
 * Run the example script.
 *
 * @param {Array} scriptArgs - The arguments passed to the script.
 * @param {Object} options - The options passed to the script.
 * @param {Massive} db - A database instance.
 * @param {Nodemailer} mailer - A mailer instance.
 */
async function run(scriptArgs, options, { db, mailer }) {
  console.log('Example script successful.');
  return { scriptArgs, options, db, mailer };
}

module.exports = { run };
