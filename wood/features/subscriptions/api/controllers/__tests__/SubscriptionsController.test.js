const { Stripe } = require('stripe');
const moment = require('moment');
const request = require('supertest');
const MockDate = require('mockdate');
const nodemailerMock = require('nodemailer-mock');
const {
  connection,
  cleanDb,
  addDefaultUser,
  COOKIE_JWT_OWNER_ID_1,
  CSRF_TOKEN_USER_ID_1,
} = require('@wood/testHelper');
const fixtureStripeCoupons = require('@wood/config/stripe/__fixtures__/coupons.json.fixture');
const fixtureStripeProducts = require('@wood/config/stripe/__fixtures__/products.json.fixture');
const fixtureStripeTaxes = require('@wood/config/stripe/__fixtures__/taxes.json.fixture');
const { overrideConfig, overrideConfigFile, clearConfigOverrides } = require('#lib/Config');
const { AppBuilder } = require('#api/AppBuilder');

let app;
let db;
let server;
let agent;

describe('SubscriptionsController', () => {
  beforeAll(async () => {
    // Make sure correct feature controllers are initialized
    overrideConfig('app', 'features.app', []);
    overrideConfig('app', 'features.wood', ['users', 'subscriptions']);

    const builder = new AppBuilder({ mailer: nodemailerMock.createTransport({}) });
    app = await builder.getApp();
    db = app.get('db');
    server = await app.listen(4000);
    agent = request.agent(server);
  });

  beforeEach(async () => {
    MockDate.set('1/1/2020');
    await cleanDb();
    nodemailerMock.mock.reset();
    await addDefaultUser(db);
    overrideConfigFile('stripe/coupons', fixtureStripeCoupons);
    overrideConfigFile('stripe/products', fixtureStripeProducts);
    overrideConfigFile('stripe/taxes', fixtureStripeTaxes);
    overrideConfig('app', 'features', { app: [], wood: ['subscriptions', 'user'] });
  });

  afterEach(async () => {
    MockDate.reset();
    clearConfigOverrides();
  });

  afterAll(async () => {
    await connection.destroy();
    await server.close();
    await db.instance.$pool.end();
  });

  // ===============================================================================================

  describe('POST /subscriptions', () => {
    it('should validate empty request', async () => {
      const response = await agent
        .post('/api/subscriptions')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({
          line1: '',
          country: '',
          state: '',
          city: '',
          postal_code: '',
          payment_method_id: '',
          product_id: '',
          price_id: '',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should validate invalid country', async () => {
      overrideConfig('geography', 'countries', { VA: 'valid' });

      const response = await agent
        .post('/api/subscriptions')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({
          line1: 'line1',
          country: 'not-a-country',
          state: 'state',
          city: 'city',
          postal_code: 'postal code',
          payment_method_id: 'payment-method-id',
          product_id: 'prod_simple',
          price_id: 'price_simple_monthly',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should validate invalid state', async () => {
      overrideConfig('geography', 'countries', { VA: 'valid' });
      overrideConfig('geography', 'states', { VA: ['valid-state'] });

      const response = await agent
        .post('/api/subscriptions')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({
          line1: 'line1',
          country: 'VA',
          state: 'not-a-state',
          city: 'city',
          postal_code: 'postal code',
          payment_method_id: 'payment-method-id',
          product_id: 'prod_simple',
          price_id: 'price_simple_monthly',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should validate invalid product & price', async () => {
      overrideConfig('geography', 'countries', { VA: 'valid' });
      overrideConfig('geography', 'states', { VA: ['valid-state'] });

      const response = await agent
        .post('/api/subscriptions')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({
          line1: 'line1',
          country: 'VA',
          state: 'valid-state',
          city: 'city',
          postal_code: 'postal code',
          payment_method_id: 'payment-method-id',
          product_id: 'not-valid-product',
          price_id: 'not-valid-price',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    it('should validate price from incorrect product', async () => {
      overrideConfig('geography', 'countries', { VA: 'valid' });
      overrideConfig('geography', 'states', { VA: ['valid-state'] });

      const response = await agent
        .post('/api/subscriptions')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({
          line1: 'line1',
          country: 'VA',
          state: 'valid-state',
          city: 'city',
          postal_code: 'postal code',
          payment_method_id: 'payment-method-id',
          product_id: 'prod_simple',
          price_id: 'price_advanced_monthly',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should create subscription', async () => {
      overrideConfig('geography', 'countries', { CA: 'Canada' });
      overrideConfig('geography', 'states', { CA: ['Ontario'] });
      Stripe.prototype.customers = {
        create: jest.fn(() => ({ id: 'new_customer_id' })),
        update: jest.fn(() => ({})),
      };
      Stripe.prototype.paymentMethods = {
        attach: jest.fn(() => ({})),
      };
      Stripe.prototype.subscriptions = {
        create: jest.fn(() => ({
          id: 'new_subscription_id',
          status: 'active',
          current_period_end: moment().add(30, 'days').unix(),
          latest_invoice: {
            payment_intent: { id: 'latest_invoice_payment_intent' },
          },
        })),
      };
      Stripe.prototype.invoices = {
        retrieveUpcoming: jest.fn(() => ({ total: 1234 })),
      };

      const response = await agent
        .post('/api/subscriptions')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({
          line1: '290 Bremner Blvd',
          country: 'CA',
          state: 'Ontario',
          city: 'Toronto',
          postal_code: 'M5V 3L9',
          payment_method_id: 'payment-method-id',
          product_id: 'prod_simple',
          price_id: 'price_simple_monthly',
          coupon_id: '50_percent',
        })
        .expect(200);

      expect(response.body).toMatchSnapshot();

      const team = await db.teams.findOne({ id: 1 });
      expect(team.stripe_customer_id).toBe('new_customer_id');

      const subscription = await db.subscriptions.findOne({ team_id: 1 });
      expect(subscription).toMatchSnapshot({
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });
    });
  });

  // ===============================================================================================

  describe('POST /subscriptions/retry', () => {
    it('should validate request', async () => {
      const response = await agent
        .post('/api/subscriptions/retry')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({
          line1: '',
          country: '',
          state: '',
          city: '',
          postal_code: '',
          payment_method_id: '',
          product_id: '',
          price_id: '',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should retry subscription creation, cancelling old sub with different values', async () => {
      await db.subscriptions.insert([{
        subscription_id: 'old_subscription_id',
        product_id: 'prod_advanced',
        price_id: 'price_advanced_monthly',
        coupon_id: '50_percent',
        tax_ids: '["txr_quebec"]',
        next_billing_date: moment().format(),
        status: 'incomplete',
        next_invoice_total: 1234,
        team_id: 1,
      }]);
      overrideConfig('geography', 'countries', { CA: 'Canada' });
      overrideConfig('geography', 'states', { CA: ['Ontario'] });
      Stripe.prototype.customers = {
        create: jest.fn(() => ({ id: 'new_customer_id' })),
        update: jest.fn(() => ({})),
      };
      Stripe.prototype.paymentMethods = {
        attach: jest.fn(() => ({})),
      };
      const delFn = jest.fn(() => {});
      Stripe.prototype.subscriptions = {
        del: delFn,
        create: jest.fn(() => ({
          id: 'new_subscription_id',
          status: 'active',
          current_period_end: moment().add(30, 'days').unix(),
          latest_invoice: { total: 4321 },
        })),
        retrieve: jest.fn(() => ({
          current_period_end: moment().add(30, 'days').unix(),
          status: 'active',
        })),
      };
      Stripe.prototype.invoices = {
        retrieveUpcoming: jest.fn(() => ({ total: 1234 })),
      };

      const response = await agent
        .post('/api/subscriptions/retry')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({
          line1: '290 Bremner Blvd',
          country: 'CA',
          state: 'Ontario',
          city: 'Toronto',
          postal_code: 'M5V 3L9',
          payment_method_id: 'payment-method-id',
          product_id: 'prod_simple',
          price_id: 'price_simple_monthly',
          coupon_id: '5_off',
        })
        .expect(200);

      expect(response.body).toMatchSnapshot();
      expect(delFn).toHaveBeenCalled();

      const team = await db.teams.findOne({ id: 1 });
      expect(team.stripe_customer_id).toBe('new_customer_id');

      const subscription = await db.subscriptions.findOne({ team_id: 1 });
      expect(subscription).toMatchSnapshot({
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });
    });
  });

  // ===============================================================================================

  describe('GET /subscriptions/coupons/:id', () => {
    it('should get a valid coupon', async () => {
      Stripe.prototype.coupons = {
        retrieve: jest.fn(() => ({ times_redeemed: 49 })),
      };

      const response = await agent
        .get('/api/subscriptions/coupons/50_percent')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should error when missing coupon', async () => {
      const response = await agent
        .get('/api/subscriptions/coupons/missing')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(404);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should error when too many redemptions', async () => {
      Stripe.prototype.coupons = {
        retrieve: jest.fn(() => ({ times_redeemed: 50 })),
      };

      const response = await agent
        .get('/api/subscriptions/coupons/50_percent')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should error when expired', async () => {
      const response = await agent
        .get('/api/subscriptions/coupons/expired')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should error when incorrect currency', async () => {
      const response = await agent
        .get('/api/subscriptions/coupons/canadian')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(404);

      expect(response.body).toMatchSnapshot();
    });
  });

  // ===============================================================================================

  describe('GET /subscriptions/invoices', () => {
    it('should get list of invoices', async () => {
      await db.teams.update(1, { stripe_customer_id: 'cus_Ho12rn7QbDbZlD' });

      Stripe.prototype.invoices = {
        list: jest.fn(() => ({
          has_more: false,
          data: [{
            id: 'in_sample',
            created: 1596512754,
            currency: 'cad',
            invoice_pdf: 'https://some_url.com',
            status: 'draft',
            total: 1000,
          }],
        })),
      };

      const response = await agent
        .get('/api/subscriptions/invoices')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should return an empty list when no customer ID', async () => {
      const response = await agent
        .get('/api/subscriptions/invoices')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });
  });

  // ===============================================================================================

  describe('DELETE /subscriptions', () => {
    it('should delete user\'s subscription', async () => {
      await db.subscriptions.insert([{
        subscription_id: 'subscription_id',
        product_id: 'prod_advanced',
        price_id: 'price_advanced_monthly',
        coupon_id: '50_percent',
        tax_ids: '[]',
        next_billing_date: moment().format(),
        status: 'active',
        next_invoice_total: 1234,
        team_id: 1,
      }]);

      const delFn = jest.fn(() => {});
      Stripe.prototype.subscriptions = {
        del: delFn,
      };

      await agent
        .delete('/api/subscriptions')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({
          message: '',
        })
        .expect(204);

      expect(delFn).toHaveBeenCalled();
      const subscription = await db.subscriptions.findOne({ team_id: 1 });
      expect(subscription).toBeNull();

      expect(nodemailerMock.mock.getSentMail()[0].text).toMatchSnapshot();
    });
  });

  // ===============================================================================================

  describe('POST /subscriptions/preview', () => {
    it('should validate the request', async () => {
      const response = await agent
        .post('/api/subscriptions/preview')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should preview subscription change', async () => {
      await db.subscriptions.insert([{
        subscription_id: 'subscription_id',
        product_id: 'prod_advanced',
        price_id: 'price_advanced_monthly',
        coupon_id: '50_percent',
        tax_ids: '[]',
        next_billing_date: moment().format(),
        status: 'active',
        next_invoice_total: 1234,
        team_id: 1,
      }]);

      Stripe.prototype.subscriptions = {
        retrieve: jest.fn(() => ({
          items: { data: [{ id: 'item_id' }] },
        })),
      };
      Stripe.prototype.invoices = {
        retrieveUpcoming: jest.fn(() => ({
          currency: 'usd',
          lines: {
            data: [{
              description: 'Unused time on Bronze after 21 Aug 2020',
              amount: -482,
            }, {
              description: '1 × Bronze (at $50.00 / year)',
              amount: 5000,
            }],
          },
          total_tax_amounts: [{
            amount: -520,
            inclusive: false,
            tax_rate: 'txr_canada',
          }],
          total_discount_amounts: [{
            amount: 500,
          }],
          discount: { coupon: { id: '50_percent' } },
          total: -4517,
        })),
      };

      const response = await agent
        .post('/api/subscriptions/preview')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({
          product_id: 'prod_advanced',
          price_id: 'price_advanced_monthly',
        })
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });
  });

  // ===============================================================================================

  describe('PUT /subscriptions', () => {
    it('should validate the request', async () => {
      const response = await agent
        .put('/api/subscriptions')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should change the subscription', async () => {
      await db.subscriptions.insert([{
        subscription_id: 'subscription_id',
        product_id: 'prod_advanced',
        price_id: 'price_advanced_monthly',
        coupon_id: '50_percent',
        tax_ids: '[]',
        next_billing_date: moment().format(),
        status: 'active',
        next_invoice_total: 1234,
        team_id: 1,
      }]);

      const updateFn = jest.fn(() => ({
        current_period_end: moment().add(30, 'days').unix(),
        status: 'active',
      }));
      Stripe.prototype.subscriptions = {
        retrieve: jest.fn(() => ({ items: { data: [{ id: 'item_id' }] } })),
        update: updateFn,
      };
      Stripe.prototype.invoices = {
        retrieveUpcoming: jest.fn(() => ({ total: -4517 })),
      };

      const response = await agent
        .put('/api/subscriptions')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({
          product_id: 'prod_simple',
          price_id: 'price_simple_monthly',
        })
        .expect(200);

      expect(response.body).toMatchSnapshot();

      expect(updateFn).toHaveBeenCalled();

      const subscription = await db.subscriptions.findOne({ team_id: 1 });
      expect(subscription).toMatchSnapshot({
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });
    });
  });
});
