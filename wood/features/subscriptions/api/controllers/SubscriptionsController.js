const logger = require('pino')({ level: process.env.LOG_LEVEL || 'info' });
const { get } = require('lodash');
const { PrivateController } = require('#api/Controllers/PrivateController');
const { SubscriptionsService } = require('#features/subscriptions/api/services/SubscriptionsService');
const { UsersService } = require('#features/users/api/services/UsersService');
const {
  SubscriptionValidator,
  CREATE_SUBSCRIPTION_FORM_FIELDS,
  RETRY_SUBSCRIPTION_FORM_FIELDS,
  CHANGE_SUBSCRIPTION_FORM_FIELDS,
} = require('#features/subscriptions/lib/validators/SubscriptionValidator');

module.exports = class SubscriptionsController extends PrivateController {
  /**
   * Constructor.
   *
   * @param {MassiveJS} db - The MassiveJS db connection.
   * @param {Mailer} mailer - The mailer.
   */
  constructor({ db, mailer } = {}) {
    super({ db, mailer });

    this.subscriptionsService = new SubscriptionsService({ db, mailer });
    this.usersService = new UsersService({ db, mailer });

    this.router.post('/subscriptions', this.create.bind(this));
    this.router.post('/subscriptions/retry', this.retry.bind(this));
    this.router.get('/subscriptions/coupons/:id', this.getCoupon.bind(this));
    this.router.get('/subscriptions/invoices', this.getInvoices.bind(this));
    this.router.delete('/subscriptions', this.cancel.bind(this));
    this.router.post('/subscriptions/preview', this.preview.bind(this));
    this.router.put('/subscriptions', this.change.bind(this));
  }

  /**
   * @api {post} /subscriptions Create a subscription
   * @apiGroup Subscription
   * @apiName Create
   */
  async create(req, res) {
    await this.withTransaction(async (tx) => {
      if (! req.body.product_id || ! req.body.price_id) {
        logger.error('Could not find price/product ID.  Have you run `nodewood stripe` yet?');
      }

      this.validate(req.body, new SubscriptionValidator(CREATE_SUBSCRIPTION_FORM_FIELDS, req.team));

      await this.subscriptionsService.saveTeamPaymentMethod(req.team, req.user, req.body);

      res.json({
        data: await this.subscriptionsService.createSubscription(tx, req.team, req.body),
      });
    });
  }

  /**
   * @api {post} /subscriptions/retry Retry a subscription payment.
   * @apiGroup Subscription
   * @apiName Retry
   */
  async retry(req, res) {
    await this.withTransaction(async (tx) => {
      this.validate(req.body, new SubscriptionValidator(RETRY_SUBSCRIPTION_FORM_FIELDS, req.team));

      await this.subscriptionsService.saveTeamPaymentMethod(req.team, req.user, req.body);

      res.json({
        data: await this.subscriptionsService.retrySubscription(tx, req.team, req.body),
      });
    });
  }

  /**
   * @api {post} /subscriptions/coupon/:id Gets a coupon by ID.
   * @apiGroup Subscription
   * @apiName GetCoupon
   */
  async getCoupon(req, res) {
    res.json({
      data: {
        coupon: await this.subscriptionsService.getCoupon(req.team, req.params.id),
      },
    });
  }

  /**
   * @api {get} /subscriptions/invoices Gets a list of a team's invoices.
   * @apiGroup Subscription
   * @apiName GetInvoices
   */
  async getInvoices(req, res) {
    res.json({
      data: {
        invoices: await this.subscriptionsService.getInvoices(req.team),
      },
    });
  }

  /**
   * @api {delete} /subscriptions Cancel the team's subscription.
   * @apiGroup Subscription
   * @apiName Cancel
   */
  async cancel(req, res) {
    await this.withTransaction(async (tx) => {
      await this.subscriptionsService.cancel(tx, req.team);
      await this.usersService.sendSupportRequest(
        req.user,
        {
          message: get(req.body, 'message', 'None'),
          title: 'Subscription Cancellation',
        },
      );

      res.sendStatus(204);
    });
  }

  /**
   * @api {post} /subscriptions/preview Preview a change to a team's subscription.
   * @apiGroup Subscription
   * @apiName Preview
   */
  async preview(req, res) {
    this.validate(req.body, new SubscriptionValidator(CHANGE_SUBSCRIPTION_FORM_FIELDS, req.team));

    res.json({
      data: await this.subscriptionsService.previewChange(
        req.team,
        req.subscription,
        req.body.price_id,
      ),
    });
  }

  /**
   * @api {put} /subscriptions Change a subscription.
   * @apiGroup Subscription
   * @apiName Change
   */
  async change(req, res) {
    await this.withTransaction(async (tx) => {
      this.validate(req.body, new SubscriptionValidator(CHANGE_SUBSCRIPTION_FORM_FIELDS, req.team));

      res.json({
        data: {
          subscription: await this.subscriptionsService.change(
            tx,
            req.team,
            req.subscription,
            req.body.product_id,
            req.body.price_id,
          ),
        },
      });
    });
  }
};
