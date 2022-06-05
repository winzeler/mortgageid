const { compare, hash } = require('bcryptjs');
const { get } = require('lodash');
const request = require('supertest');
const moment = require('moment');
const MockDate = require('mockdate');
const { isISO8601 } = require('validator');
const nodemailerMock = require('nodemailer-mock');
const {
  connection,
  cleanDb,
  addDefaultUser,
} = require('@wood/testHelper');
const { AppBuilder } = require('#api/AppBuilder');
const { overrideConfig, clearConfigOverrides } = require('#lib/Config');

let app;
let db;
let server;
let agent;
let oldRandom;

describe('PublicTeamsController', () => {
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
    oldRandom = global.Math.random;
    global.Math.random = () => 0.5;
  });

  afterEach(async () => {
    MockDate.reset();
    clearConfigOverrides();
    global.Math.random = oldRandom;
  });

  afterAll(async () => {
    await connection.destroy();
    await server.close();
    await db.instance.$pool.end();
  });

  // ===============================================================================================

  describe('GET /public/team/invites/:token', () => {
    it('should error if no invite for that token', async () => {
      const response = await agent
        .get('/api/public/team/invites/not_a_valid_token')
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should return invite details where user does not exist', async () => {
      await db.team_invites.insert([
        { team_id: 1, email: 'valid@domain.com', name: 'name', role: 'owner', token: 'valid_token' },
      ]);

      const response = await agent
        .get('/api/public/team/invites/valid_token')
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should return invite users where user does already exist', async () => {
      await db.users.insert([
        { id: 2, email: 'valid@domain.com', name: 'name2', account_type: 'user', flags: {} },
      ]);
      await db.team_invites.insert([
        { team_id: 1, email: 'valid@domain.com', name: 'name', role: 'owner', token: 'valid_token' },
      ]);

      const response = await agent
        .get('/api/public/team/invites/valid_token')
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should redirect to login with error if already on team', async () => {
      await db.users.insert([
        { id: 2, email: 'valid@domain.com', name: 'name2', account_type: 'user', flags: {} },
      ]);
      await db.users_teams.insert([
        { user_id: 2, team_id: 1, role: 'member' },
      ]);
      await db.team_invites.insert([
        { team_id: 1, email: 'valid@domain.com', name: 'name', role: 'member', token: 'valid_token' },
      ]);

      const response = await agent
        .get('/api/public/team/invites/valid_token')
        .expect(401);

      expect(response.body).toMatchSnapshot();

      const invite = await db.team_invites.findOne({ token: 'valid_token' });
      expect(invite).toBeNull();
    });

    // ---------------------------------------------------------------------------------------------

    it('should error if invite has expired', async () => {
      overrideConfig('teams', 'inviteExpiry', [1, 'days']);
      await db.team_invites.insert([{
        team_id: 1,
        email: 'valid@domain.com',
        name: 'name',
        role: 'member',
        token: 'valid_token',
        created_at: moment().subtract(2, 'days').format(),
      }]);

      const response = await agent
        .get('/api/public/team/invites/expired_token')
        .expect(400);

      expect(response.body).toMatchSnapshot();

      const invite = await db.team_invites.findOne({ token: 'expired_token' });
      expect(invite).toBeNull();
    });
  });

  // ===============================================================================================

  describe('PUT /public/team/invites/:token', () => {
    it('should error if no invite for that token', async () => {
      const response = await agent
        .post('/api/public/team/invites/invalid_token')
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should validate the request when user exists', async () => {
      await db.users.insert([
        { id: 2, email: 'valid@domain.com', name: 'name2', account_type: 'user', flags: {} },
      ]);
      await db.team_invites.insert([
        { team_id: 1, email: 'valid@domain.com', name: 'name', role: 'member', token: 'valid_token' },
      ]);

      const response = await agent
        .post('/api/public/team/invites/valid_token')
        .send({ password: 'short' })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should validate the request when user doesn\'t exist', async () => {
      await db.team_invites.insert([
        { team_id: 1, email: 'valid@domain.com', name: 'name', role: 'member', token: 'valid_token' },
      ]);

      const response = await agent
        .post('/api/public/team/invites/valid_token')
        .send({ name: '', password: 'short', password_repeat: 'nope' })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should error if invite has expired', async () => {
      overrideConfig('teams', 'inviteExpiry', [1, 'days']);
      await db.team_invites.insert([{
        team_id: 1,
        email: 'valid@domain.com',
        name: 'name',
        role: 'member',
        token: 'valid_token',
        created_at: moment().subtract(2, 'days').format(),
      }]);

      const response = await agent
        .post('/api/public/team/invites/expired_token')
        .expect(400);

      expect(response.body).toMatchSnapshot();

      const invite = await db.team_invites.findOne({ token: 'expired_token' });
      expect(invite).toBeNull();
    });

    // ---------------------------------------------------------------------------------------------

    it('should error if mismatch password for existing user', async () => {
      await db.users.insert([
        { id: 2, email: 'existing@domain.com', name: 'name2', password: 'password', account_type: 'user', flags: {} },
      ]);
      await db.team_invites.insert([
        { team_id: 1, email: 'existing@domain.com', name: 'name', role: 'member', token: 'token' },
      ]);

      const response = await agent
        .post('/api/public/team/invites/token')
        .send({ password: 'bad_password' })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should add user to team', async () => {
      await db.users.insert([
        {
          id: 2,
          email: 'existing@domain.com',
          name: 'name2',
          password: await hash('password', parseInt(process.env.PASSWORD_SALT_ROUNDS, 10)),
          account_type: 'user',
          flags: {},
        },
      ]);
      await db.team_invites.insert([
        { team_id: 1, email: 'existing@domain.com', name: 'name', role: 'member', token: 'token' },
      ]);

      const response = await agent
        .post('/api/public/team/invites/token')
        .send({ password: 'password' })
        .expect(204);

      expect(response.headers['set-cookie']).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should create user and add to team', async () => {
      await db.team_invites.insert([
        { team_id: 1, email: 'new@domain.com', name: 'name', role: 'member', token: 'token' },
      ]);

      const response = await agent
        .post('/api/public/team/invites/token')
        .send({ name: 'actually_name', password: 'password', password_repeat: 'password' })
        .expect(204);

      expect(response.headers['set-cookie']).toMatchSnapshot();

      const user = await db.users.findOne({ email: 'new@domain.com' });

      expect(user).toMatchSnapshot({
        flags: expect.any(Object),
        secure_flags: expect.any(Object),
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
        password: expect.any(String),
      });

      expect(await compare('password', user.password)).toBe(true);
      expect(await compare('not_password', user.password)).toBe(false);

      const creationToken = get(user, 'secure_flags.creationToken');
      const creationTokenDate = get(user, 'secure_flags.creationTokenGeneratedAt');

      // Token must be valid date
      expect(isISO8601(creationTokenDate)).toBe(true);

      // Sent email must contain reset token from user
      expect(nodemailerMock.mock.getSentMail()[0].html)
        .toEqual(expect.stringContaining(creationToken));
    });
  });
});
