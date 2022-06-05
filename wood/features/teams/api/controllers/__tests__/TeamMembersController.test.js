const Hashids = require('hashids/cjs');
const request = require('supertest');
const moment = require('moment');
const MockDate = require('mockdate');
const nodemailerMock = require('nodemailer-mock');
const {
  connection,
  cleanDb,
  addDefaultUser,
  COOKIE_JWT_OWNER_ID_1,
  COOKIE_JWT_MEMBER_ID_1,
  CSRF_TOKEN_USER_ID_1,
} = require('@wood/testHelper');
const fixtureStripeProducts = require('@wood/config/stripe/__fixtures__/products.json.fixture');
const { AppBuilder } = require('#api/AppBuilder');
const { overrideConfig, overrideConfigFile, clearConfigOverrides } = require('#lib/Config');

const hashids = new Hashids(process.env.JWT_HASHID_SALT, 5);
const HASHID_1 = hashids.encode(1); // '0ymXM',
const HASHID_2 = hashids.encode(2); // 'bMYjy';

let app;
let db;
let server;
let agent;

describe('TeamMembersController', () => {
  beforeAll(async () => {
    // Make sure correct feature controllers are initialized
    overrideConfig('app', 'features.app', []);
    overrideConfig('app', 'features.wood', ['users', 'teams', 'subscriptions']);

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
    overrideConfig('teams', 'subscriptionMemberLimits', false);
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

  describe('GET /team/members', () => {
    it('should list team members', async () => {
      await db.teams.insert([{ id: 2, name: 'name', currency: 'usd' }]);
      await db.users.insert([
        { id: 2, email: 'user2@email.com', name: 'name2', account_type: 'user', flags: {} },
        { id: 3, email: 'user3@email.com', name: 'name3', account_type: 'user', flags: {} },
      ]);
      await db.users_teams.insert([
        { user_id: 2, team_id: 1, role: 'member' },
        { user_id: 3, team_id: 1, role: 'member' },
      ]);
      await db.team_invites.insert([
        { team_id: 1, name: 'name-a', email: 'email-a@domain.com', role: 'owner', token: 'abc' },
        { team_id: 1, name: 'name-b', email: 'email-b@domain.com', role: 'member', token: 'def' },
        { team_id: 2, name: 'name-no', email: 'email-no@domain.com', role: 'owner', token: 'ghi' },
      ]);

      const response = await agent
        .get('/api/team/members')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should display member limit based on subscription', async () => {
      overrideConfig('teams', 'subscriptionMemberLimits', true);
      overrideConfigFile('stripe/products', fixtureStripeProducts);

      await db.subscriptions.insert([{
        subscription_id: 'subscription_id',
        product_id: 'prod_memberlimit',
        price_id: 'price_memberlimit_monthly',
        tax_ids: '[]',
        next_billing_date: moment().format(),
        status: 'active',
        next_invoice_total: 1234,
        team_id: 1,
      }]);

      const response = await agent
        .get('/api/team/members')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should not list users from other teams', async () => {
      await db.teams.insert([{ id: 2, name: 'name', currency: 'usd' }]);
      await db.users.insert([
        { id: 2, email: 'otherteam@email.com', name: 'otherteam', account_type: 'user', flags: {} },
      ]);
      await db.users_teams.insert([{ user_id: 2, team_id: 2, role: 'member' }]);

      const response = await agent
        .get('/api/team/members')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });
  });

  // ===============================================================================================

  describe('PUT /team/members/:id', () => {
    it('should validate the request', async () => {
      const response = await agent
        .put(`/api/team/members/${HASHID_2}`)
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({ role: 'notrole' })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should prevent user from updating own role', async () => {
      const response = await agent
        .put(`/api/team/members/${HASHID_1}`)
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({ role: 'member' })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should ensure user has permission to update team members', async () => {
      await db.users.insert([
        { id: 2, email: 'notmyteam@email.com', name: 'name2', account_type: 'user', flags: {} },
      ]);
      await db.users_teams.insert([
        { user_id: 2, team_id: 1, role: 'member' },
      ]);

      const response = await agent
        .put(`/api/team/members/${HASHID_2}`)
        .set('Cookie', COOKIE_JWT_MEMBER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({ role: 'member' })
        .expect(401);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should ensure user is updating team member on own team', async () => {
      await db.users.insert([
        { id: 2, email: 'notmyteam@email.com', name: 'name2', account_type: 'user', flags: {} },
      ]);
      await db.teams.insert([{ id: 2, name: 'notmyteam', currency: 'usd' }]);
      await db.users_teams.insert([
        { user_id: 2, team_id: 2, role: 'member' },
      ]);

      const response = await agent
        .put(`/api/team/members/${HASHID_2}`)
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({ role: 'member' })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should update the team member\'s role, ensuring jwt_series is incremented', async () => {
      await db.users.insert([
        { id: 2, email: 'user2@email.com', name: 'name2', account_type: 'user', flags: {} },
      ]);
      await db.users_teams.insert([
        { user_id: 2, team_id: 1, role: 'member' },
      ]);

      await agent
        .put(`/api/team/members/${HASHID_2}`)
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({ role: 'member' })
        .expect(204);

      const user_team = await db.users_teams.findOne({ user_id: 2, team_id: 1 });
      expect(user_team.role).toBe('member');

      const user = await db.users.findOne({ id: 2 });
      expect(user.jwt_series).toBe(2);
    });
  });

  // ===============================================================================================

  describe('DELETE /team/members/:id', () => {
    it('should prevent user from removing self from team', async () => {
      const response = await agent
        .delete(`/api/team/members/${HASHID_1}`)
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should ensure user has permission to update team members', async () => {
      await db.users.insert([
        { id: 2, email: 'notmyteam@email.com', name: 'name2', account_type: 'user', flags: {} },
      ]);
      await db.users_teams.insert([
        { user_id: 2, team_id: 1, role: 'member' },
      ]);

      const response = await agent
        .delete(`/api/team/members/${HASHID_2}`)
        .set('Cookie', COOKIE_JWT_MEMBER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(401);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should ensure user is removing team member from own team', async () => {
      await db.users.insert([
        { id: 2, email: 'notmyteam@email.com', name: 'name2', account_type: 'user', flags: {} },
      ]);
      await db.teams.insert([{ id: 2, name: 'notmyteam', currency: 'usd' }]);
      await db.users_teams.insert([
        { user_id: 2, team_id: 2, role: 'member' },
      ]);

      const response = await agent
        .delete(`/api/team/members/${HASHID_2}`)
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should remove team member from team', async () => {
      await db.users.insert([
        { id: 2, email: 'myteam@email.com', name: 'name2', account_type: 'user', flags: {} },
      ]);
      await db.teams.insert([{ id: 2, name: 'myteam', currency: 'usd' }]);
      await db.users_teams.insert([
        { user_id: 2, team_id: 1, role: 'member' },
      ]);

      await agent
        .delete(`/api/team/members/${HASHID_2}`)
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(204);

      const user_team = await db.users_teams.findOne({ user_id: 2, team_id: 1 });
      expect(user_team).toBe(null);
    });
  });

  // ===============================================================================================

  describe('POST /team/invites', () => {
    it('should validate the request', async () => {
      const response = await agent
        .post('/api/team/invites')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({ name: '', email: 'notanemail', role: 'invalid_role' })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should ensure user has permission to invite team members', async () => {
      const response = await agent
        .post('/api/team/invites')
        .set('Cookie', COOKIE_JWT_MEMBER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({ name: 'name', email: 'email@domain.com', role: 'member' })
        .expect(401);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should invite a team member', async () => {
      const response = await agent
        .post('/api/team/invites')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({ name: 'name', email: 'email@domain.com', role: 'owner' })
        .expect(200);

      expect(response.body).toMatchSnapshot();

      const invite = await db.team_invites.findOne({ email: 'email@domain.com' });
      expect(invite.role).toBe('owner');

      // Sent email must contain token from invite
      expect(nodemailerMock.mock.getSentMail()[0].html)
        .toEqual(expect.stringContaining(invite.token));
    });

    // ---------------------------------------------------------------------------------------------

    it('should re-send invite for duplicate team member, updating role & token', async () => {
      await db.team_invites.insert([
        { team_id: 1, email: 'exists@domain.com', name: 'name', role: 'owner', token: 'oldtoken' },
      ]);

      const response = await agent
        .post('/api/team/invites')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({ name: 'name', email: 'exists@domain.com', role: 'member' })
        .expect(200);

      expect(response.body).toMatchSnapshot();

      const invite = await db.team_invites.findOne({ email: 'exists@domain.com' });
      expect(invite.role).toBe('member');
      expect(invite.token).not.toBe('oldtoken');

      // Sent email must contain token from invite
      expect(nodemailerMock.mock.getSentMail()[0].html)
        .toEqual(expect.stringContaining(invite.token));
    });

    // ---------------------------------------------------------------------------------------------

    it('should not let you invite past subscription member limit', async () => {
      overrideConfig('teams', 'subscriptionMemberLimits', true);
      overrideConfigFile('stripe/products', fixtureStripeProducts);
      await db.subscriptions.insert([{
        subscription_id: 'subscription_id',
        product_id: 'prod_memberlimit',
        price_id: 'price_memberlimit_monthly',
        tax_ids: '[]',
        next_billing_date: moment().format(),
        status: 'active',
        next_invoice_total: 1234,
        team_id: 1,
      }]);
      await db.users.insert([
        { id: 2, email: 'user2@email.com', name: 'name2', account_type: 'user', flags: {} },
      ]);
      await db.users_teams.insert([
        { user_id: 2, team_id: 1, role: 'member' },
      ]);

      const response = await agent
        .post('/api/team/invites')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({ name: 'name', email: 'exists@domain.com', role: 'member' })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should take invites into account when considering member limit', async () => {
      overrideConfig('teams', 'subscriptionMemberLimits', true);
      overrideConfigFile('stripe/products', fixtureStripeProducts);
      await db.subscriptions.insert([{
        subscription_id: 'subscription_id',
        product_id: 'prod_memberlimit',
        price_id: 'price_memberlimit_monthly',
        tax_ids: '[]',
        next_billing_date: moment().format(),
        status: 'active',
        next_invoice_total: 1234,
        team_id: 1,
      }]);
      await db.team_invites.insert([
        { team_id: 1, name: 'name', email: 'email@domain.com', role: 'member', token: 'token' },
      ]);

      const response = await agent
        .post('/api/team/invites')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({ name: 'name', email: 'exists@domain.com', role: 'member' })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should only count members + invites from own team for member limit', async () => {
      overrideConfig('teams', 'subscriptionMemberLimits', true);
      overrideConfigFile('stripe/products', fixtureStripeProducts);
      await db.subscriptions.insert([{
        subscription_id: 'subscription_id',
        product_id: 'prod_memberlimit',
        price_id: 'price_memberlimit_monthly',
        tax_ids: '[]',
        next_billing_date: moment().format(),
        status: 'active',
        next_invoice_total: 1234,
        team_id: 1,
      }]);
      await db.teams.insert([{ id: 2, name: 'notmyteam', currency: 'usd' }]);
      await db.team_invites.insert([
        { team_id: 2, name: 'name', email: 'email@domain.com', role: 'member', token: 'token' },
      ]);
      await db.users.insert([
        { id: 2, email: 'user2@email.com', name: 'name2', account_type: 'user', flags: {} },
      ]);
      await db.users_teams.insert([
        { user_id: 2, team_id: 2, role: 'member' },
      ]);

      const response = await agent
        .post('/api/team/invites')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({ name: 'name', email: 'exists@domain.com', role: 'member' })
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });
  });

  // ===============================================================================================

  describe('DELETE /team/invites/:email', () => {
    it('should error if no invite for that email adddress', async () => {
      const response = await agent
        .delete('/api/team/invites/exists@domain.com')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should ensure user has permission to cancel invites', async () => {
      await db.team_invites.insert([
        { team_id: 1, email: 'exists@domain.com', name: 'name', role: 'owner', token: 'oldtoken' },
      ]);

      const response = await agent
        .delete('/api/team/invites/exists@domain.com')
        .set('Cookie', COOKIE_JWT_MEMBER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({ name: 'name', email: 'email@domain.com', role: 'member' })
        .expect(401);

      expect(response.body).toMatchSnapshot();

      const invite = await db.team_invites.find({ email: 'exists@domain.com' });
      expect(invite).toHaveLength(1);
    });

    // ---------------------------------------------------------------------------------------------

    it('should error if invite is for another team', async () => {
      await db.teams.insert([{ id: 2, name: 'notmyteam', currency: 'usd' }]);
      await db.team_invites.insert([
        { team_id: 2, email: 'exists@domain.com', name: 'name', role: 'owner', token: 'oldtoken' },
      ]);

      const response = await agent
        .delete('/api/team/invites/exists@domain.com')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should remove the invite', async () => {
      await db.team_invites.insert([
        { team_id: 1, email: 'exists@domain.com', name: 'name', role: 'owner', token: 'oldtoken' },
      ]);

      await agent
        .delete('/api/team/invites/exists@domain.com')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(204);

      const invite = await db.team_invites.findOne({ email: 'exists@domain.com' });
      expect(invite).toBeNull();
    });
  });
});
