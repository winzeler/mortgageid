const moment = require('moment');
const request = require('supertest');
const MockDate = require('mockdate');
const { get } = require('lodash');
const { isISO8601 } = require('validator');
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

describe('AdminUsersController', () => {
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
    });
    overrideConfig('app', 'features.wood', ['admin', 'users']);
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

  describe('GET /admin/users', () => {
    it('should validate the request', async () => {
      const response = await agent
        .get('/api/admin/users')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .query({ page: 'abc', per: 'def' })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should list first page of users, in reverse order of creation', async () => {
      await db.users.insert([{ id: 3, email: 'user3@email.com', password: 'password3', name: 'name3', account_type: 'user', flags: {}, currency: 'usd' }]);
      await db.users.insert([{ id: 2, email: 'user2@email.com', password: 'password2', name: 'name2', account_type: 'user', flags: {}, currency: 'usd' }]);

      const response = await agent
        .get('/api/admin/users')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .query({ page: 1, per: 2 })
        .expect(200);

      expect(response.body).toMatchSnapshot({
        data: {
          users: [
            { created_at: expect.any(String), updated_at: expect.any(String) },
            { created_at: expect.any(String), updated_at: expect.any(String) },
          ],
        },
      });
    });

    // ---------------------------------------------------------------------------------------------

    it('should list first page of users, with team & role added', async () => {
      await db.users.insert([{ id: 3, email: 'user3@email.com', password: 'password3', name: 'name3', account_type: 'user', flags: {}, currency: 'usd' }]);
      await db.users.insert([{ id: 2, email: 'user2@email.com', password: 'password2', name: 'name2', account_type: 'user', flags: {}, currency: 'usd' }]);

      await db.teams.insert([{ id: 3, name: 'team3', currency: 'usd' }]);
      await db.teams.insert([{ id: 2, name: 'team2', currency: 'usd' }]);

      await db.users_teams.insert([{ user_id: 3, team_id: 3, role: 'owner' }]);
      await db.users_teams.insert([{ user_id: 2, team_id: 2, role: 'member' }]);

      overrideConfig('app', 'features.wood', ['admin', 'users', 'teams']);

      const response = await agent
        .get('/api/admin/users')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .query({ page: 1, per: 2 })
        .expect(200);

      expect(response.body).toMatchSnapshot({
        data: {
          users: [
            {
              created_at: expect.any(String),
              updated_at: expect.any(String),
              teams: [{
                team: {
                  created_at: expect.any(String),
                  updated_at: expect.any(String),
                },
              }],
            },
            {
              created_at: expect.any(String),
              updated_at: expect.any(String),
              teams: [{
                team: {
                  created_at: expect.any(String),
                  updated_at: expect.any(String),
                },
              }],
            },
          ],
        },
      });
    });

    // ---------------------------------------------------------------------------------------------

    it('should list first page of users, with subscription added', async () => {
      await db.users.insert([{ id: 3, email: 'user3@email.com', password: 'password3', name: 'name3', account_type: 'user', flags: {}, currency: 'usd' }]);
      await db.users.insert([{ id: 2, email: 'user2@email.com', password: 'password2', name: 'name2', account_type: 'user', flags: {}, currency: 'usd' }]);

      await db.teams.insert([{ id: 3, name: 'team3', currency: 'usd' }]);
      await db.teams.insert([{ id: 2, name: 'team2', currency: 'usd' }]);

      await db.users_teams.insert([{ user_id: 3, team_id: 3, role: 'owner' }]);
      await db.users_teams.insert([{ user_id: 2, team_id: 2, role: 'member' }]);

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
      overrideConfig('app', 'features.wood', ['admin', 'users', 'subscriptions']);

      const response = await agent
        .get('/api/admin/users')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .query({ page: 1, per: 2 })
        .expect(200);

      expect(response.body).toMatchSnapshot({
        data: {
          users: [
            {
              created_at: expect.any(String),
              updated_at: expect.any(String),
              teams: [{
                team: {
                  created_at: expect.any(String),
                  updated_at: expect.any(String),
                },
              }],
            },
            {
              created_at: expect.any(String),
              updated_at: expect.any(String),
              teams: [{
                team: {
                  created_at: expect.any(String),
                  updated_at: expect.any(String),
                },
              }],
            },
          ],
        },
      });
    });
  });

  // ===============================================================================================

  describe('PUT /admin/users/:id', () => {
    it('should validate the request', async () => {
      await db.users.insert({ id: 2, email: 'user2@email.com', name: 'name', account_type: 'account_type', flags: {}, jwt_series: 1, currency: 'usd' });

      const response = await agent
        .put('/api/admin/users/2')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({
          name: '',
          account_type: 'not-an-account-type',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should update the user', async () => {
      await db.users.insert({ id: 2, password: 'password', email: 'user2@email.com', name: 'name', account_type: 'account_type', flags: {}, jwt_series: 1, currency: 'usd' });

      await agent
        .put('/api/admin/users/2')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({
          name: 'new name',
          account_type: 'user',
        })
        .expect(204);

      const user = await db.users.findOne({ id: 2 });

      expect(user).toMatchSnapshot({
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
        password: expect.any(String),
      });
    });
  });

  // ===============================================================================================

  describe('PUT /admin/users/:id/reset-password', () => {
    it('should send a password reset email', async () => {
      await db.users.insert({
        id: 2,
        password: 'password',
        email: 'user2@email.com',
        name: 'name',
        account_type: 'account_type',
        flags: {},
        jwt_series: 1,
      });

      await agent
        .post('/api/admin/users/2/reset-password')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(204);

      const user = await db.users.find(2);

      const resetToken = get(user, 'secure_flags.passwordResetToken');
      const resetTokenDate = get(user, 'secure_flags.passwordResetTokenGeneratedAt');

      // Token must be valid date
      expect(isISO8601(resetTokenDate)).toBe(true);

      // Sent email must contain reset token from user
      expect(nodemailerMock.mock.getSentMail()[0].html)
        .toEqual(expect.stringContaining(resetToken));
    });
  });

  // ===============================================================================================

  describe('PUT /admin/users/:id/resendConfirmation', () => {
    it('should send an email confirmation email', async () => {
      await db.users.insert({
        id: 2,
        password: 'password',
        email: 'user2@email.com',
        name: 'name',
        account_type: 'account_type',
        flags: {},
        jwt_series: 1,
      });

      await agent
        .post('/api/admin/users/2/resend-confirmation')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(204);

      const user = await db.users.find(2);

      const creationToken = get(user, 'secure_flags.creationToken');
      const creationTokenDate = get(user, 'secure_flags.creationTokenGeneratedAt');

      // Token must be valid date
      expect(isISO8601(creationTokenDate)).toBe(true);

      // Sent email must contain reset token from user
      expect(nodemailerMock.mock.getSentMail()[0].html)
        .toEqual(expect.stringContaining(creationToken));
    });
  });

  // ===============================================================================================

  describe('DELETE /admin/users/:id', () => {
    it('should delete a user', async () => {
      await db.users.insert({
        id: 2,
        password: 'password',
        email: 'user2@email.com',
        name: 'name',
        account_type: 'account_type',
        flags: {},
        jwt_series: 1,
      });

      await agent
        .delete('/api/admin/users/2')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(204);

      const user = await db.users.find(2);

      expect(user).toBe(null);
    });
  });
});
