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
const { AppBuilder } = require('#api/AppBuilder');
const { overrideConfig, overrideConfigFile, clearConfigOverrides } = require('#lib/Config');

let app;
let db;
let server;
let agent;

describe('NoAccessController', () => {
  beforeAll(async () => {
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
    overrideConfig('app', 'features.app', []);
    overrideConfig('app', 'features.wood', ['users', 'subscriptions']);
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

  describe('GET /no-access', () => {
    it('should disallow access when no subscription', async () => {
      const response = await agent
        .get('/api/no-access')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(401);

      expect(response.body).toMatchSnapshot();
    });

    it('should disallow access when subscription without capabilities', async () => {
      await db.subscriptions.insert([{
        team_id: 1,
        subscription_id: 'subscription_id',
        product_id: 'prod_advanced',
        price_id: 'price_advanced_monthly',
        coupon_id: '50_percent',
        tax_ids: '[]',
        next_billing_date: moment().format(),
        status: 'active',
        next_invoice_total: 1234,
      }]);

      const response = await agent
        .get('/api/no-access')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(401);

      expect(response.body).toMatchSnapshot();
    });
  });
});
