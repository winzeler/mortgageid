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
const { overrideConfig, overrideConfigFile, clearConfigOverrides } = require('#lib/Config');
const { AppBuilder } = require('#api/AppBuilder');

let app;
let db;
let server;
let agent;

describe('AdminTeamsController', () => {
  beforeAll(async () => {
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
    await addDefaultUser(db, {
      userOverride: {
        account_type: 'admin',
      },
      teamOverride: {
        created_at: moment().format(),
      },
    });
    overrideConfig('app', 'features.wood', ['admin', 'users', 'teams']);
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

  describe('GET /admin/teams', () => {
    it('should validate the request', async () => {
      const response = await agent
        .get('/api/admin/teams')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .query({ page: 'abc', per: 'def' })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should list first page of teams, in reverse order of creation', async () => {
      await db.teams.insert([
        { id: 3, name: 'team3', currency: 'usd', stripe_customer_id: 'abc', created_at: moment().add(31, 'days').format() },
        { id: 2, name: 'team2', currency: 'usd', stripe_customer_id: 'def', created_at: moment().add(30, 'days').format() },
      ]);

      const response = await agent
        .get('/api/admin/teams')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .query({ page: 1, per: 2 })
        .expect(200);

      expect(response.body).toMatchSnapshot({
        data: {
          teams: [
            { created_at: expect.any(String), updated_at: expect.any(String) },
            { created_at: expect.any(String), updated_at: expect.any(String) },
          ],
        },
      });
    });

    // ---------------------------------------------------------------------------------------------

    it('should list first page of teams, with subscription added', async () => {
      await db.teams.insert([
        { id: 3, name: 'team3', currency: 'usd', stripe_customer_id: 'abc', created_at: moment().add(31, 'days').format() },
        { id: 2, name: 'team2', currency: 'usd', stripe_customer_id: 'def', created_at: moment().add(30, 'days').format() },
      ]);
      await db.subscriptions.insert([{
        team_id: 3,
        subscription_id: 'subscription_id_3',
        product_id: 'prod_simple',
        price_id: 'price_simple_monthly',
        next_billing_date: moment().add(30, 'days').format(),
        status: 'active',
        currency: 'usd',
        tax_ids: '[]',
        next_invoice_total: 0,
      }]);
      await db.subscriptions.insert([{
        team_id: 2,
        subscription_id: 'subscription_id_2',
        product_id: 'prod_advanced',
        price_id: 'price_advanced_monthly',
        next_billing_date: moment().add(30, 'days').format(),
        status: 'active',
        currency: 'usd',
        tax_ids: '[]',
        next_invoice_total: 0,
      }]);
      overrideConfigFile('stripe/products', fixtureStripeProducts);
      overrideConfig('app', 'features.wood', ['admin', 'users', 'teams', 'subscriptions']);

      const response = await agent
        .get('/api/admin/teams')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .query({ page: 1, per: 2 })
        .expect(200);

      expect(response.body).toMatchSnapshot({
        data: {
          teams: [
            {
              created_at: expect.any(String),
              updated_at: expect.any(String),
              subscription: {
                created_at: expect.any(String),
                updated_at: expect.any(String),
              },
            },
            {
              created_at: expect.any(String),
              updated_at: expect.any(String),
              subscription: {
                created_at: expect.any(String),
                updated_at: expect.any(String),
              },
            },
          ],
        },
      });
    });
  });

  // ===============================================================================================

  describe('PUT /admin/teams/:id', () => {
    it('should validate the request', async () => {
      await db.teams.insert([{ id: 2, name: 'team2', currency: 'usd', stripe_customer_id: 'abc' }]);

      const response = await agent
        .put('/api/admin/teams/2')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({
          name: '',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should update the team', async () => {
      await db.teams.insert([{ id: 2, name: 'team2', currency: 'usd', stripe_customer_id: 'abc' }]);

      await agent
        .put('/api/admin/teams/2')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({
          name: 'new name',
        })
        .expect(204);

      const team = await db.teams.findOne({ id: 2 });

      expect(team).toMatchSnapshot({
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });
    });
  });

  // ===============================================================================================

  describe('DELETE /admin/teams/:id', () => {
    it('should delete a team', async () => {
      await db.teams.insert([{ id: 2, name: 'team2', currency: 'usd', stripe_customer_id: 'abc' }]);
      await db.users.insert({
        id: 2,
        password: 'password',
        email: 'user2@email.com',
        name: 'name',
        account_type: 'account_type',
        flags: {},
        jwt_series: 1,
      });
      await db.users_teams.insert({ user_id: 2, team_id: 2, role: 'owner' });
      await db.team_invites.insert({
        team_id: 2,
        name: 'name',
        email: 'email@domain.com',
        role: 'member',
        token: 'token',
      });

      await agent
        .delete('/api/admin/teams/2')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(204);

      const team = await db.teams.find(2);
      const user = await db.users.find(2);
      const user_team = await db.users_teams.findOne({ team_id: 2, user_id: 2 });
      const invite = await db.team_invites.findOne({ team_id: 2 });

      expect(team).toBe(null);
      expect(user_team).toBe(null);
      expect(invite).toBe(null);

      // User should still be there
      expect(user).toMatchSnapshot({
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });
    });
  });
});
