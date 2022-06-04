/* global jest */

class Stripe {}
const stripe = jest.fn(() => new Stripe());

module.exports = stripe;
module.exports.Stripe = Stripe;
