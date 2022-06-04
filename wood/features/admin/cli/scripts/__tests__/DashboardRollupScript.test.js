const MockDate = require('mockdate');
const nodemailerMock = require('nodemailer-mock');
const moment = require('moment');
const fixtureStripeProducts = require('@wood/config/stripe/__fixtures__/products.json.fixture');
const { connection, cleanDb } = require('@wood/testHelper');
const { overrideConfigFile, clearConfigOverrides } = require('#lib/Config');
const { getDb } = require('#api/Db');
const { run } = require('#features/admin/cli/scripts/DashboardRollupScript');

let db;

describe('DashboardRollupScript', () => {
  beforeAll(async () => {
    db = await getDb();
  });

  beforeEach(async () => {
    MockDate.set('1/1/2020 15:00'); // Start mid-afternoon
    await cleanDb();
    nodemailerMock.mock.reset();
  });

  afterEach(async () => {
    MockDate.reset();
    clearConfigOverrides();
  });

  afterAll(async () => {
    await connection.destroy();
    await db.instance.$pool.end();
  });

  // ===============================================================================================

  describe('run', () => {
    it('should add users, teams, mrr to rollup entries', async () => {
      overrideConfigFile('stripe/products', fixtureStripeProducts);
      await db.users.insert({
        id: 2,
        created_at: '2019-12-25T08:34:29+00:00',
        email: 'user@email.com',
        password: 'password',
        name: 'User 1 for Team 1',
        account_type: 'account_type',
        flags: {},
        jwt_series: 1,
      });
      await db.users.insert({
        id: 3,
        created_at: '2019-12-27T08:34:29+00:00',
        email: 'user2@email.com',
        password: 'password',
        name: 'User 2 for Team 1',
        account_type: 'account_type',
        flags: {},
        jwt_series: 1,
      });
      await db.users.insert({
        id: 4,
        created_at: '2019-12-30T08:34:29+00:00',
        email: 'user3@email.com',
        password: 'password',
        name: 'User 1 for Team 2',
        account_type: 'account_type',
        flags: {},
        jwt_series: 1,
      });
      await db.teams.insert({
        id: 2,
        created_at: '2019-12-25T08:34:29+00:00',
        name: 'First team',
        currency: 'usd',
      });
      await db.teams.insert({
        id: 3,
        created_at: '2019-12-30T08:34:29+00:00',
        name: 'Second team',
        currency: 'usd',
      });
      await db.subscriptions.insert([{
        subscription_id: 'subscription_id',
        product_id: 'prod_simple',
        price_id: 'price_simple_monthly',
        created_at: '2019-12-25T08:34:29+00:00',
        tax_ids: '[]',
        next_billing_date: moment().format(),
        status: 'active',
        next_invoice_total: 1234,
        team_id: 2,
      }]);
      await db.subscriptions.insert([{
        subscription_id: 'subscription_id_2',
        product_id: 'prod_advanced',
        price_id: 'price_advanced_annual',
        created_at: '2019-12-30T08:34:29+00:00',
        tax_ids: '[]',
        next_billing_date: moment().format(),
        status: 'active',
        next_invoice_total: 1234,
        team_id: 3,
      }]);

      await run([], {}, { db });

      const rollups = await db.admin_dashboard_rollups.find({});
      expect(rollups).toMatchSnapshot();
    });
  });
});
