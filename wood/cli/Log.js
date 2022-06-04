/* eslint-disable no-console */
const logger = require('pino')({ level: process.env.LOG_LEVEL || 'info' });
const stripAnsi = require('strip-ansi');

/**
 * Log a message to the console.
 *
 * @param {String} level - The level to log at.
 * @param {String} message - The message to log.
 * @param {String} format - The format to log in ('json`, 'text' or 'plain').
 * @param {Object} extra - An extra object to log, if logging in JSON format.
 */
function log(level, message, format, { extra = null } = {}) {
  if (! ['debug', 'verbose', 'info', 'warn', 'error'].includes(level)) {
    console.error(`Invalid log level: ${level}.`);
    console.error(`Original message: ${message}`);
    if (extra) {
      console.error(extra);
    }
  }

  if (format === 'json') {
    if (extra === null) {
      logger[level](stripAnsi(message));
    }
    else {
      logger[level](extra, stripAnsi(message));
    }
  }
  else if (format === 'plain') {
    console[level](stripAnsi(message));
  }
  else {
    console[level](message);
  }
}

module.exports = {
  log,
};
