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
const fixtureStripeProducts = require('@wood/config/stripe/__fixtures__/products.json.fixture');
const { AppBuilder } = require('#api/AppBuilder');
const { overrideConfig, overrideConfigFile, clearConfigOverrides } = require('#lib/Config');

let app;
let db;
let server;
let agent;

describe('AdminDashboardController', () => {
  beforeAll(async () => {
    const builder = new AppBuilder({ mailer: nodemailerMock.createTransport({}) });
    app = await builder.getApp();
    db = app.get('db');
    server = await app.listen(4000);
    agent = request.agent(server);
  });

  beforeEach(async () => {
    // Date needs to be further into month for this test, else no users are part of current month
    MockDate.set('1/7/2020');
    await cleanDb();
    nodemailerMock.mock.reset();
    await addDefaultUser(db, {
      userOverride: {
        account_type: 'admin',
        created_at: moment().subtract(5, 'days').format(),
      },
      teamOverride: {
        created_at: moment().subtract(5, 'days').format(),
      },
    });
    overrideConfigFile('stripe/products', fixtureStripeProducts);
    overrideConfig('app', 'features.app', []);
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

  describe('GET /admin/dashboard (Teams Disabled)', () => {
    it('should display demo dashboard data', async () => {
      overrideConfig('admin', 'displayDashboardDemoData', true);
      overrideConfig('app', 'features.wood', ['subscriptions', 'users']);

      const response = await agent
        .get('/api/admin/dashboard')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should display demo dashboard data without mrr data when subscriptions are disabled', async () => { // eslint-disable-line max-len
      overrideConfig('admin', 'displayDashboardDemoData', true);
      overrideConfig('app', 'features.wood', ['users']);

      const response = await agent
        .get('/api/admin/dashboard')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should display live dashboard data', async () => {
      overrideConfig('admin', 'displayDashboardDemoData', false);
      overrideConfig('app', 'features.wood', ['subscriptions', 'users']);

      await db.admin_dashboard_rollups.insert([
        { day: '2020/01/06', users_count: 5, mrr_amount: 6000 },
        { day: '2020/01/05', users_count: 5, mrr_amount: 6000 },
        { day: '2020/01/04', users_count: 4, mrr_amount: 6000 },
        { day: '2020/01/03', users_count: 3, mrr_amount: 6000 },
        { day: '2020/01/02', users_count: 3, mrr_amount: 6000 },
        { day: '2020/01/01', users_count: 2, mrr_amount: 1000 },
        { day: '2019/12/31', users_count: 2, mrr_amount: 1000 },
        { day: '2019/12/30', users_count: 2, mrr_amount: 1000 },
      ]);

      await db.users.insert([
        { id: 2, email: 'user2@email.com', password: 'password2', name: 'name2', account_type: 'user', flags: {}, created_at: moment().subtract(50, 'days').format() },
        { id: 3, email: 'user3@email.com', password: 'password3', name: 'name3', account_type: 'user', flags: {}, created_at: moment().subtract(40, 'days').format() },
        { id: 4, email: 'user4@email.com', password: 'password4', name: 'name4', account_type: 'user', flags: {}, created_at: moment().subtract(2, 'days').format() },
        { id: 5, email: 'user5@email.com', password: 'password5', name: 'name5', account_type: 'user', flags: {}, created_at: moment().subtract(1, 'days').format() },
      ]);

      await db.teams.insert([
        { id: 2, name: 'name2', currency: 'usd' },
        { id: 3, name: 'name3', currency: 'usd' },
        { id: 4, name: 'name4', currency: 'usd' },
        { id: 5, name: 'name5', currency: 'usd' },
      ]);

      await db.users_teams.insert([
        { user_id: 2, team_id: 2, role: 'owner' },
        { user_id: 3, team_id: 3, role: 'owner' },
        { user_id: 4, team_id: 4, role: 'owner' },
        { user_id: 5, team_id: 5, role: 'owner' },
      ]);

      await db.subscriptions.insert([
        { team_id: 3, subscription_id: 'subscription_id', product_id: 'prod_simple', price_id: 'price_simple_monthly', next_billing_date: moment().add(30, 'days').format(), status: 'active', currency: 'usd', tax_ids: '[]', next_invoice_total: 0 },
        { team_id: 4, subscription_id: 'subscription_id', product_id: 'prod_simple', price_id: 'price_simple_annual', next_billing_date: moment().add(30, 'days').format(), status: 'active', currency: 'usd', tax_ids: '[]', next_invoice_total: 0 },
        { team_id: 5, subscription_id: 'subscription_id', product_id: 'prod_advanced', price_id: 'price_advanced_annual', next_billing_date: moment().add(30, 'days').format(), status: 'active', currency: 'usd', tax_ids: '[]', next_invoice_total: 0 },
      ]);

      const response = await agent
        .get('/api/admin/dashboard')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should not display mrr data when subscriptions are disabled', async () => {
      overrideConfig('admin', 'displayDashboardDemoData', false);
      overrideConfig('app', 'features.wood', ['users']);

      await db.admin_dashboard_rollups.insert([
        { day: '2020/01/06', users_count: 5 },
        { day: '2020/01/05', users_count: 5 },
        { day: '2020/01/04', users_count: 4 },
        { day: '2020/01/03', users_count: 3 },
        { day: '2020/01/02', users_count: 3 },
        { day: '2020/01/01', users_count: 2 },
        { day: '2019/12/31', users_count: 2 },
        { day: '2019/12/30', users_count: 2 },
      ]);

      await db.users.insert([
        { id: 2, email: 'user2@email.com', password: 'password2', name: 'name2', account_type: 'user', flags: {}, created_at: moment().subtract(50, 'days').format() },
        { id: 3, email: 'user3@email.com', password: 'password3', name: 'name3', account_type: 'user', flags: {}, created_at: moment().subtract(40, 'days').format() },
        { id: 4, email: 'user4@email.com', password: 'password4', name: 'name4', account_type: 'user', flags: {}, created_at: moment().subtract(2, 'days').format() },
        { id: 5, email: 'user5@email.com', password: 'password5', name: 'name5', account_type: 'user', flags: {}, created_at: moment().subtract(1, 'days').format() },
      ]);

      const response = await agent
        .get('/api/admin/dashboard')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });
  });

  // ===============================================================================================

  describe('GET /admin/dashboard (Teams Enabled)', () => {
    it('should display demo dashboard data', async () => {
      overrideConfig('admin', 'displayDashboardDemoData', true);
      overrideConfig('app', 'features.wood', ['subscriptions', 'users', 'teams']);

      const response = await agent
        .get('/api/admin/dashboard')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should display demo dashboard data without mrr data when subscriptions are disabled', async () => {
      overrideConfig('admin', 'displayDashboardDemoData', true);
      overrideConfig('app', 'features.wood', ['users', 'teams']);

      const response = await agent
        .get('/api/admin/dashboard')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should display live dashboard data', async () => {
      overrideConfig('admin', 'displayDashboardDemoData', false);
      overrideConfig('app', 'features.wood', ['subscriptions', 'users', 'teams']);

      await db.admin_dashboard_rollups.insert([
        { day: '2020/01/06', teams_count: 5, mrr_amount: 6000 },
        { day: '2020/01/05', teams_count: 5, mrr_amount: 6000 },
        { day: '2020/01/04', teams_count: 4, mrr_amount: 6000 },
        { day: '2020/01/03', teams_count: 3, mrr_amount: 0 },
        { day: '2020/01/02', teams_count: 2, mrr_amount: 0 },
        { day: '2020/01/01', teams_count: 1, mrr_amount: 0 },
        { day: '2019/12/31', teams_count: 1, mrr_amount: 0 },
        { day: '2019/12/30', teams_count: 1, mrr_amount: 0 },
      ]);

      await db.teams.insert([
        { id: 2, name: 'name2', currency: 'usd', created_at: moment().subtract(50, 'days').format() },
        { id: 3, name: 'name3', currency: 'usd', created_at: moment().subtract(3, 'days').format() },
        { id: 4, name: 'name4', currency: 'usd', created_at: moment().subtract(2, 'days').format() },
        { id: 5, name: 'name5', currency: 'usd', created_at: moment().subtract(1, 'days').format() },
      ]);

      await db.subscriptions.insert([
        { team_id: 3, subscription_id: 'subscription_id', product_id: 'prod_simple', price_id: 'price_simple_monthly', next_billing_date: moment().add(30, 'days').format(), status: 'active', currency: 'usd', tax_ids: '[]', next_invoice_total: 0 },
        { team_id: 4, subscription_id: 'subscription_id', product_id: 'prod_simple', price_id: 'price_simple_annual', next_billing_date: moment().add(30, 'days').format(), status: 'active', currency: 'usd', tax_ids: '[]', next_invoice_total: 0 },
        { team_id: 5, subscription_id: 'subscription_id', product_id: 'prod_advanced', price_id: 'price_advanced_annual', next_billing_date: moment().add(30, 'days').format(), status: 'active', currency: 'usd', tax_ids: '[]', next_invoice_total: 0 },
      ]);

      const response = await agent
        .get('/api/admin/dashboard')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should not display mrr data when subscriptions are disabled', async () => {
      overrideConfig('admin', 'displayDashboardDemoData', false);
      overrideConfig('app', 'features.wood', ['users', 'teams']);

      await db.admin_dashboard_rollups.insert([
        { day: '2020/01/06', teams_count: 5 },
        { day: '2020/01/05', teams_count: 5 },
        { day: '2020/01/04', teams_count: 4 },
        { day: '2020/01/03', teams_count: 3 },
        { day: '2020/01/02', teams_count: 2 },
        { day: '2020/01/01', teams_count: 1 },
        { day: '2019/12/31', teams_count: 1 },
        { day: '2019/12/30', teams_count: 1 },
      ]);

      await db.teams.insert([
        { id: 2, name: 'name2', currency: 'usd', created_at: moment().subtract(50, 'days').format() },
        { id: 3, name: 'name3', currency: 'usd', created_at: moment().subtract(3, 'days').format() },
        { id: 4, name: 'name4', currency: 'usd', created_at: moment().subtract(2, 'days').format() },
        { id: 5, name: 'name5', currency: 'usd', created_at: moment().subtract(1, 'days').format() },
      ]);

      const response = await agent
        .get('/api/admin/dashboard')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });
  });
});
