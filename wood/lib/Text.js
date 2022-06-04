/**
 * @type {String} Default to using URL-safe characters.
 */
const DEFAULT_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_~';

/**
 * Get a string of random characters.
 *
 * @param {Number} length - The length of the string to get.
 * @param {String} characters - The valid characters to choose from.
 *
 * @return {String}
 */
function randString(length, characters = DEFAULT_CHARACTERS) {
  const charactersLength = characters.length;

  let chosen = []; // eslint-disable-line prefer-const
  for (let i = 0; i < length; i += 1) {
    chosen.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
  }

  return chosen.join('');
}

/**
 * Formats a number as a currency.
 *
 * @param {Number} cents - The value to format, in cents.
 * @param {String} currency - The currency to format in.
 *
 * @return {String}
 */
function currencyFormat(cents, currency) {
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);

  return `${formattedValue} ${currency.toUpperCase()}`;
}

/**
 * Displays a formatted price with the interval.
 *
 * @param {Number} cents - The value to format, in cents.
 * @param {String} currency - The currency to format in.
 * @param {String} interval - The interval, i.e. "years" or "days".
 * @param {Number} intervalCount - The count of intervals before the price is charged again.
 *
 * @return {String}
 */
function intervalPrice(cents, currency, interval, intervalCount) {
  const formattedInterval = intervalCount > 1
    ? `every ${intervalCount} ${interval}s`
    : `/ ${interval}`;
  return `${currencyFormat(cents, currency)} ${formattedInterval}`;
}

module.exports = {
  randString,
  currencyFormat,
  intervalPrice,
};
