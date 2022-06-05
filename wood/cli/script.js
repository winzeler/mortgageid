const { resolve } = require('path');
require('dotenv').config({ path: resolve(__dirname, '../../.env') });

require('module-alias/register');
require('../api/Require');

const nodemailer = require('nodemailer');
const minimist = require('minimist');
const chalk = require('chalk');
const { get } = require('lodash');
const { getDb } = require('#api/Db');
const { getConfig, getConfigApi } = require('#lib/Config');
const { sendMail } = require('#lib/Email');
const { log } = require('#cli/Log');

/**
 * Run the CLI script.
 */
async function runScript() {
  // Configure DB
  const db = await getDb();
  const mailer = nodemailer.createTransport(getConfigApi('email', 'transportConfig'));
  const args = minimist(process.argv.slice(2));

  let [scriptName, ...scriptArgs] = args._; // eslint-disable-line prefer-const
  scriptName = scriptName.startsWith('#') ? scriptName : `#${scriptName}`;

  const { _, ...options } = args; // eslint-disable-line no-unused-vars

  try {
    const { run } = require(scriptName); // eslint-disable-line

    await run(scriptArgs, options, { db, mailer });
  }
  catch (error) {
    if (error.message.split('\n')[0].startsWith('Cannot find module')) {
      log(
        'error',
        chalk.red(`Cound not find script '${chalk.cyan(scriptName)}'.`),
        get(options, 'format'),
      );
    }
    else {
      log('error', error, get(options, 'format'));
    }

    if (get(args, 'emailOnError', false)) {
      const errorAddress = get(args, 'errorAddress', getConfig('email', 'supportEmail'));

      try {
        await sendMail(mailer, {
          from: `${getConfig('app', 'name')} <${getConfig('email', 'fromEmail')}>`,
          to: errorAddress,
          subject: `Script error from ${scriptName}`,
          text: error.message,
        });
      }
      catch (mailerError) {
        log('error', chalk.red(mailerError), get(options, 'format'));
      }
    }
  }

  await db.instance.$pool.end();
}

module.exports = {
  runScript,
};
