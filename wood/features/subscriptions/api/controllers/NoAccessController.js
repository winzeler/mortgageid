const { PrivateController } = require('#api/Controllers/PrivateController');

module.exports = class NoAccessController extends PrivateController {
  /**
   * Constructor.
   *
   * @param {MassiveJS} db - The MassiveJS db connection.
   * @param {Mailer} mailer - The mailer.
   */
  constructor({ db, mailer } = {}) {
    super({ db, mailer });

    this.router.get(
      '/no-access',
      this.requireSubscription(['no-access']),
      this.noAccess.bind(this),
    );
  }

  /**
   * This endpoint should never return successfully, since no subscription will have a'no-access'
   * capability.  This endpoint is only here for testing.
   */
  async noAccess(req, res) {
    res.sendStatus(204);
  }
};
