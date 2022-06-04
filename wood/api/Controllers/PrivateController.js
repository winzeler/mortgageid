const { Controller } = require('#api/Controller');
const { Standard401Error, ERROR_NOT_AUTHORIZED } = require('#lib/Errors');

module.exports.PrivateController = class PrivateController extends Controller {
  /**
   * Constructor.
   *
   * @param {MassiveJS} db - The MassiveJS db connection.
   * @param {Mailer} mailer - The mailer.
   */
  constructor({ db, mailer } = {}) {
    super({ db, mailer });
  }

  /**
   * Creates a middleware that limits route access to users with a subscription with the provided
   * capabilities.
   *
   * @param {Array<String>} capabilities - The list of capabilities that the user's subscription
   *                                       must provide.
   *
   * @return {Function} Returns the created middleware.
   */
  requireSubscription(capabilities) {
    return (req, res, next) => {
      if (! req.subscription) {
        next(new Standard401Error([{
          code: ERROR_NOT_AUTHORIZED,
          title: 'You require a subscription to access this resource.',
        }], { redirectTo: '/subscription' }));
      }
      else if (! req.subscription.hasCapabilities(capabilities)) {
        next(new Standard401Error([{
          code: ERROR_NOT_AUTHORIZED,
          title: 'Your subscription does not have the capability to access this resource.',
        }], { redirectTo: '/subscription' }));
      }
      else {
        next();
      }
    };
  }

  /**
   * Creates a middleware that limits route access to users with a role with the provided
   * permissions.
   *
   * @param {Array<String>} permissions - The list of permissions that the user's role
   *                                       must provide.
   *
   * @return {Function} Returns the created middleware.
   */
  requirePermissions(permissions) {
    return (req, res, next) => {
      if (! req.role.hasPermissions(permissions)) {
        next(new Standard401Error([{
          code: ERROR_NOT_AUTHORIZED,
          title: 'Your role does not have the permissions to access this resource.',
        }]));
      }
      else {
        next();
      }
    };
  }
};
