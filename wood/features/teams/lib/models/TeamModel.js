const moment = require('moment');
const { Model } = require('#lib/Model');
const { FieldNumber, FieldString, FieldCustom } = require('#lib/Fields');
const { SubscriptionModel } = require('#features/subscriptions/lib/models/SubscriptionModel');

/**
 * @type {Object} Field configuration.
 */
const TEAM_MODEL_FIELDS = {
  id: new FieldNumber({ label: 'ID' }),
  name: new FieldString({ label: 'Name' }),
  currency: new FieldString({ label: 'Currency' }),
  subscription: new FieldCustom({
    label: 'Subscription',
    desktopValueClasses: ['text-center'],
    valueFn: (s) => (s ? s.value('fullName') : 'None'),
  }),
};

class TeamModel extends Model {
  /**
   * Constructor.
   *
   * @param {Number} id - The ID of this model.
   * @param {String} name - The full name of this model.
   * @param {String} currency - The currency the team pays in.
   * @param {Number} stripe_customer_id - The team's Stripe Customer ID.
   * @param {Date} created_at - The date the team was created.
   * @param {Date} updated_at - The date the team was last updated.
   * @param {Object} flags - The miscellaneous flags that apply to this team.
   * @param {Object} secure_flags - Flags that apply to this team but must not be sent via the API.
   * @param {Object} subscription - The subscription this team is subscribed to.
   */
  constructor({
    id,
    name,
    currency,
    stripe_customer_id,
    created_at,
    updated_at,
    flags,
    secure_flags,
    subscription,
  } = {}) {
    super(TEAM_MODEL_FIELDS);

    this.id = id;
    this.name = name;
    this.currency = currency;
    this.stripeCustomerId = stripe_customer_id;
    this.createdAt = moment(created_at);
    this.updatedAt = moment(updated_at);
    this.flags = flags || {};
    this.secureFlags = secure_flags || {};

    if (subscription) {
      this.subscription = new SubscriptionModel(subscription);
    }
  }

  /**
   * Convert model to JSON.
   *
   * @return {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      currency: this.currency,
      // Stripe Customer ID is not serialized for security
      created_at: this.createdAt.format(),
      updated_at: this.updatedAt.format(),
      flags: this.flags,
      // Secure flags are not serialized for security
      subscription: this.subscription,
    };
  }

  /**
   * If a team has a specific flag set.
   *
   * @param {String} flag - The name of the flag to check.
   * @param {String} value - If set, a value the flag must be set to in order to return true.
   *
   * @return {Boolean}
   */
  hasFlag(flag, value = null) {
    if (Object.keys(this.flags).includes(flag)) {
      return value === null ? true : this.flags[flag] === value;
    }

    if (Object.keys(this.secureFlags).includes(flag)) {
      return value === null ? true : this.secureFlags[flag] === value;
    }

    return false;
  }
}

module.exports = {
  TeamModel,
  TEAM_MODEL_FIELDS,
};
