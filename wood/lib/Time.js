/**
 * Utilities having to do with time.  Delay, manipulation, etc.
 */

/**
 * Delay execution.
 *
 * @param {Number} ms - The number of milliseconds to delay execution.
 *
 * @return {Promise}
 */
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Delay execution for a minimum amount of time while waiting for a function to complete.
 *
 * @param {Number} ms - The minimum number of milliseconds to delay execution.
 * @param {Promise} promise - The promise (usually async function) to wait for.
 *
 * @return {Mixed}
 */
async function delayMin(ms, promise) {
  const [value] = await Promise.all([
    promise,
    delay(ms),
  ]);
  return value;
}

module.exports = {
  delay,
  delayMin,
  SECOND_IN_MS: 1000,
  MINUTE_IN_SECONDS: 60,
  HOUR_IN_SECONDS: 3600,
  DAY_IN_SECONDS: 86400,
};
