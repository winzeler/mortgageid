const { Controller } = require('#api/Controller');
const { ACCOUNT_TYPE_ADMIN } = require('#features/users/lib/models/UserModel');
const { Standard401Error, ERROR_NOT_AUTHORIZED } = require('#lib/Errors');

module.exports.AdminController = class AdminController extends Controller {
  /**
   * Constructor.
   *
   * @param {MassiveJS} db - The MassiveJS db connection.
   * @param {Mailer} mailer - The mailer.
   */
  constructor({ db, mailer }) {
    super({ db, mailer });

    this.router.all('*', this.requireAdmin);
    this.prefix = '/api/admin';
  }

  /**
   * Limit routes to admin users.
   *
   * @param {Request} req - The request.
   * @param {Response} res - The response.
   * @param {Function} next - Request chaining.
   */
  requireAdmin(req, res, next) {
    if (req.user.accountType !== ACCOUNT_TYPE_ADMIN) {
      next(new Standard401Error([{
        code: ERROR_NOT_AUTHORIZED,
        title: 'User is not an admin.',
      }]));
    }
    else {
      next();
    }
  }
};
