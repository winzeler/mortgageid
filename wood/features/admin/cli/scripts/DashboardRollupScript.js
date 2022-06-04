const chalk = require('chalk');
const { get } = require('lodash');
const { log } = require('#cli/Log');
const { DashboardRollupService } = require('#features/admin/api/services/DashboardRollupService');

class DashboardRollup {
  constructor(db, options) {
    this.db = db;
    this.format = get(options, 'format');

    this.rollupService = new DashboardRollupService({ db });
  }

  async run() {
    try {
      const day = await this.rollupService.getStartDate();
      let entriesCreated = 0;

      /* eslint-disable no-await-in-loop */
      while (! this.rollupService.isTodayOrLater(day)) {
        await this.db.withTransaction(async (tx) => {
          await this.rollupDay(tx, day);
        });

        day.add(1, 'day');
        entriesCreated += 1;
      }
      /* eslint-enable */

      log('info', `${entriesCreated} rollup entries created.`, this.format);
    }
    catch (error) {
      if (['OutOfRangeError', 'NotFoundError'].includes(error.constructor.name)) {
        log('warn', chalk.yellow(error.message), this.format);
        process.exit(0);
      }

      throw error;
    }
  }

  /**
   * Rollup a day of data.
   *
   * Allows for rollup behaviour to be extended or overridden to include new data.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Moment} day - The day to roll up.
   */
  async rollupDay(tx, day) {
    return this.rollupService.createRollupForDay(tx, day);
  }
}

/**
 * Run the example script.
 *
 * @param {Array} scriptArgs - The arguments passed to the script.
 * @param {Object} options - The options passed to the script.
 * @param {Massive} db - A database instance.
 * @param {Nodemailer} mailer - A mailer instance.
 */
async function run(scriptArgs, options, { db, mailer }) {
  const runner = new DashboardRollup(db, options);
  await runner.run();
}

module.exports = { DashboardRollup, run };
