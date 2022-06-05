const { Stripe } = require('stripe');
const moment = require('moment');
const request = require('supertest');
const MockDate = require('mockdate');
const nodemailerMock = require('nodemailer-mock');
const { get } = require('lodash');
const { isISO8601 } = require('validator');
const {
  connection,
  cleanDb,
  addDefaultUser,
  COOKIE_JWT_OWNER_ID_1,
  COOKIE_JWT_OWNER_ID_1_EXPIRED,
  CSRF_TOKEN_USER_ID_1,
} = require('@wood/testHelper');
const fixtureStripeCoupons = require('@wood/config/stripe/__fixtures__/coupons.json.fixture');
const fixtureStripeProducts = require('@wood/config/stripe/__fixtures__/products.json.fixture');
const fixtureStripeTaxes = require('@wood/config/stripe/__fixtures__/taxes.json.fixture');
const { payload1mb } = require('./__fixtures__/LargePayload.fixture');
const { AppBuilder } = require('#api/AppBuilder');
const { overrideConfig, overrideConfigFile, clearConfigOverrides } = require('#lib/Config');

let app;
let db;
let server;
let agent;

describe('UsersController', () => {
  beforeAll(async () => {
    overrideConfig('app', 'features.app', []);
    overrideConfig('app', 'features.wood', ['subscriptions', 'users']);
    overrideConfigFile('stripe/coupons', fixtureStripeCoupons);
    overrideConfigFile('stripe/products', fixtureStripeProducts);
    overrideConfigFile('stripe/taxes', fixtureStripeTaxes);
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
  });

  afterEach(async () => {
    MockDate.reset();
  });

  afterAll(async () => {
    clearConfigOverrides();
    await connection.destroy();
    await server.close();
    await db.instance.$pool.end();
  });

  // ===============================================================================================

  describe('GET /me', () => {
    it('should return current users info', async () => {
      await addDefaultUser(db);

      const response = await agent
        .get('/api/users/me')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(200);

      expect(response.body).toMatchSnapshot({
        data: {
          user: {
            created_at: expect.any(String),
            updated_at: expect.any(String),
          },
          team: {
            created_at: expect.any(String),
            updated_at: expect.any(String),
          },
        },
      });
    });

    // ---------------------------------------------------------------------------------------------

    it('should return info with a subscription', async () => {
      await addDefaultUser(db);
      await db.subscriptions.insert({
        team_id: 1,
        subscription_id: 'subscription_id',
        product_id: 'prod_simple',
        price_id: 'price_simple_monthly',
        next_billing_date: moment().add(30, 'days').format(),
        status: 'active',
        currency: 'usd',
        tax_ids: '[]',
        next_invoice_total: 0,
      });

      const response = await agent
        .get('/api/users/me')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(200);

      expect(response.body).toMatchSnapshot({
        data: {
          user: {
            created_at: expect.any(String),
            updated_at: expect.any(String),
          },
          team: {
            created_at: expect.any(String),
            updated_at: expect.any(String),
          },
        },
      });
    });

    // ---------------------------------------------------------------------------------------------

    it('should update subscription next_billing_date', async () => {
      const expectedNextBillingDate = moment().add(30, 'days');
      Stripe.prototype.subscriptions = {
        retrieve: jest.fn(() => ({
          current_period_end: expectedNextBillingDate.unix(),
          status: 'active',
        })),
      };
      Stripe.prototype.invoices = {
        retrieveUpcoming: jest.fn(() => ({ total: 1234 })),
      };

      await addDefaultUser(db);
      await db.subscriptions.insert({
        team_id: 1,
        subscription_id: 'subscription_id',
        product_id: 'prod_simple',
        price_id: 'price_simple_monthly',
        next_billing_date: moment().subtract(30, 'days').format(),
        status: 'active',
        currency: 'usd',
        tax_ids: '[]',
        next_invoice_total: 0,
      });

      const response = await agent
        .get('/api/users/me')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(200);

      expect(response.body).toMatchSnapshot({
        data: {
          user: {
            created_at: expect.any(String),
            updated_at: expect.any(String),
          },
          team: {
            created_at: expect.any(String),
            updated_at: expect.any(String),
          },
        },
      });

      const subscription = await db.subscriptions.findOne({ subscription_id: 'subscription_id' });
      expect(subscription.next_billing_date).toEqual(expectedNextBillingDate.toDate());
    });

    // ---------------------------------------------------------------------------------------------

    it('return unauthorized when no user', async () => {
      // Only tested in this endpoint to prove it works framework-wide
      await agent
        .get('/api/users/me')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .expect(401);
    });

    // ---------------------------------------------------------------------------------------------

    it('return unauthorized when missing bearer token', async () => {
      // Only tested in this endpoint to prove it works framework-wide
      await agent
        .get('/api/users/me')
        .expect(401);
    });

    // ---------------------------------------------------------------------------------------------

    it('should return unauthorized when user JWT series mismatch', async () => {
      // Only tested in this endpoint to prove it works framework-wide
      await addDefaultUser(db, {
        userOverride: {
          jwt_series: 5,
        },
      });

      const response = await agent
        .get('/api/users/me')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .expect(401);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should return unauthorized when global JWT series mismatch', async () => {
      // Only tested in this endpoint to prove it works framework-wide
      const oldGlobalSeries = process.env.JWT_GLOBAL_SERIES;
      process.env.JWT_GLOBAL_SERIES = 5;

      await addDefaultUser(db);

      const response = await agent
        .get('/api/users/me')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .expect(401);

      expect(response.body).toMatchSnapshot();

      process.env.JWT_GLOBAL_SERIES = oldGlobalSeries;
    });

    // ---------------------------------------------------------------------------------------------

    it('should return unauthorized when JWT has expired', async () => {
      // Only tested in this endpoint to prove it works framework-wide
      await addDefaultUser(db);

      const response = await agent
        .get('/api/users/me')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1_EXPIRED)
        .expect(401);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should return unauthorized when no csrf token', async () => {
      // Only tested in this endpoint to prove it works framework-wide
      await addDefaultUser(db);

      const response = await agent
        .get('/api/users/me')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .expect(401);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should return unauthorized when invalid csrf token', async () => {
      // Only tested in this endpoint to prove it works framework-wide
      await addDefaultUser(db);

      const response = await agent
        .get('/api/users/me')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', 'invalid')
        .expect(401);

      expect(response.body).toMatchSnapshot();
    });
  });

  // ===============================================================================================

  describe('POST /resend-confirmation', () => {
    it('should resend confirmation email', async () => {
      await addDefaultUser(db);

      await agent
        .post('/api/users/resend-confirmation')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(204);

      const user = await db.users.findOne({ email: 'user@email.com' });

      const creationToken = get(user, 'secure_flags.creationToken');
      const creationTokenDate = get(user, 'secure_flags.creationTokenGeneratedAt');

      // Token must be valid date
      expect(isISO8601(creationTokenDate)).toBe(true);

      // Sent email must contain reset token from user
      expect(nodemailerMock.mock.getSentMail()[0].html)
        .toEqual(expect.stringContaining(creationToken));
    });

    // Weird place for this, I know
    it('should properly catch PayloadTooLarge errors', async () => {
      const response = await agent
        .post('/api/users/resend-confirmation')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({ tooLarge: payload1mb })
        .expect(413);

      expect(response.body).toMatchSnapshot();
    });
  });

  // ===============================================================================================

  describe('PUT /', () => {
    it('should validate form', async () => {
      await addDefaultUser(db);

      const response = await agent
        .put('/api/users')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({
          name: '',
          password: 'no',
          password_repeat: 'match',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should not complain about missing passwords', async () => {
      await addDefaultUser(db);

      const response = await agent
        .put('/api/users')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({
          name: '',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should update user', async () => {
      await addDefaultUser(db);

      await agent
        .put('/api/users')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({
          name: 'new name',
          password: 'newPassword',
          password_repeat: 'newPassword',
        })
        .expect(204);

      const user = await db.users.findOne({ id: 1 });

      expect(user).toMatchSnapshot({
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
        password: expect.not.stringMatching('password'),
      });
    });
  });

  // ===============================================================================================

  describe('POST /users/support', () => {
    it('should send support request email', async () => {
      await addDefaultUser(db);

      await agent
        .post('/api/users/support')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({
          message: 'This is a support request message.',
        })
        .expect(204);

      expect(nodemailerMock.mock.getSentMail()[0].text).toMatchSnapshot();
    });
  });
});
