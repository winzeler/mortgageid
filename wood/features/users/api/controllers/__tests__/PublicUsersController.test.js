const { compare, hash } = require('bcryptjs');
const moment = require('moment');
const request = require('supertest');
const MockDate = require('mockdate');
const nodemailerMock = require('nodemailer-mock');
const { get } = require('lodash');
const { isISO8601 } = require('validator');
const { connection, cleanDb, addDefaultUser } = require('@wood/testHelper');
const { AppBuilder } = require('#api/AppBuilder');
const {
  FLAG_LAST_FAILED_LOGIN,
  FLAG_FAILED_LOGIN_COUNT,
} = require('#features/users/lib/models/UserModel');
const { getConfig, overrideConfig } = require('#lib/Config');

let app;
let db;
let server;
let agent;
let oldRandom;

describe('PublicUsersController', () => {
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
    oldRandom = global.Math.random;
    global.Math.random = () => 0.5;
  });

  afterEach(async () => {
    MockDate.reset();
    global.Math.random = oldRandom;
  });

  afterAll(async () => {
    await connection.destroy();
    await server.close();
    await db.instance.$pool.end();
  });

  // ===============================================================================================

  describe('POST /public/signup', () => {
    it('should validate form', async () => {
      overrideConfig('app', 'features.app', []);
      overrideConfig('app', 'features.wood', ['users']); // No teams

      const response = await agent
        .post('/api/public/signup')
        .send({
          email: 'not a valid email address',
          name: '',
          password: 'abc',
          password_repeat: 'def',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should validate form when teams are enabled', async () => {
      overrideConfig('app', 'features.app', []);
      overrideConfig('app', 'features.wood', ['users', 'teams']);
      overrideConfig('teams', 'teamNameOptional', false);

      const response = await agent
        .post('/api/public/signup')
        .send({
          email: 'not a valid email address',
          name: '',
          team_name: '',
          password: 'abc',
          password_repeat: 'def',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should create a user', async () => {
      overrideConfig('app', 'features.app', []);
      overrideConfig('app', 'features.wood', ['users']); // No teams

      const response = await agent
        .post('/api/public/signup')
        .send({
          email: 'valid@email.com',
          name: 'name',
          password: 'password',
          password_repeat: 'password',
        })
        .expect(204);

      // Confirm expected JWT in cookie
      expect(response.headers['set-cookie']).toMatchSnapshot();

      const user = await db.users.findOne({ email: 'valid@email.com' });

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

      const user_team = await db.users_teams.findOne({ user_id: user.id });
      const team = await db.teams.findOne({ id: user_team.team_id });

      expect(team).toMatchSnapshot({
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });

      // Sent email must contain reset token from user
      expect(nodemailerMock.mock.getSentMail()[0].html)
        .toEqual(expect.stringContaining(creationToken));
    });

    // ---------------------------------------------------------------------------------------------

    it('should error when duplicate email', async () => {
      await addDefaultUser(db, {
        userOverride: {
          email: 'duplicate@email.com',
        },
      });

      await agent
        .post('/api/public/signup')
        .send({
          email: 'duplicate@email.com',
          name: 'name',
          password: 'password',
          password_repeat: 'password',
        })
        .expect(400);
    });

    // ---------------------------------------------------------------------------------------------

    it('should use a different name for team when teams enabled', async () => {
      overrideConfig('app', 'features.app', []);
      overrideConfig('app', 'features.wood', ['users', 'teams']);

      const response = await agent
        .post('/api/public/signup')
        .send({
          email: 'valid@email.com',
          name: 'user name',
          team_name: 'team name',
          password: 'password',
          password_repeat: 'password',
        })
        .expect(204);

      // Confirm expected JWT in cookie
      expect(response.headers['set-cookie']).toMatchSnapshot();

      const user = await db.users.findOne({ email: 'valid@email.com' });

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

      const user_team = await db.users_teams.findOne({ user_id: user.id });
      const team = await db.teams.findOne({ id: user_team.team_id });

      expect(team).toMatchSnapshot({
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });

      // Sent email must contain reset token from user
      expect(nodemailerMock.mock.getSentMail()[0].html)
        .toEqual(expect.stringContaining(creationToken));
    });

    // ---------------------------------------------------------------------------------------------

    it('should create a default team name when team name is optional and empty', async () => {
      overrideConfig('app', 'features.app', []);
      overrideConfig('app', 'features.wood', ['users', 'teams']);
      overrideConfig('teams', 'teamNameOptional', true);

      const response = await agent
        .post('/api/public/signup')
        .send({
          email: 'valid@email.com',
          name: 'user name',
          team_name: '',
          password: 'password',
          password_repeat: 'password',
        })
        .expect(204);

      // Confirm expected JWT in cookie
      expect(response.headers['set-cookie']).toMatchSnapshot();

      const user = await db.users.findOne({ email: 'valid@email.com' });

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

      const user_team = await db.users_teams.findOne({ user_id: user.id });
      const team = await db.teams.findOne({ id: user_team.team_id });

      expect(team).toMatchSnapshot({
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });

      // Sent email must contain reset token from user
      expect(nodemailerMock.mock.getSentMail()[0].html)
        .toEqual(expect.stringContaining(creationToken));
    });
  });

  // ===============================================================================================

  describe('POST /public/login', () => {
    it('should validate form', async () => {
      const response = await agent
        .post('/api/public/login')
        .send({
          email: 'not a valid email address',
          password: 'abc',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should log in a user and clear failed login counts', async () => {
      await addDefaultUser(db, {
        userOverride: {
          password: await hash('password', parseInt(process.env.PASSWORD_SALT_ROUNDS, 10)),
          flags: {
            [FLAG_LAST_FAILED_LOGIN]: moment().format(),
            [FLAG_FAILED_LOGIN_COUNT]: 1,
          },
        },
      });

      const response = await agent
        .post('/api/public/login')
        .send({
          email: 'user@email.com',
          password: 'password',
        })
        .expect(204);

      // Confirm expected JWT in cookie
      expect(response.headers['set-cookie']).toMatchSnapshot();

      // Confirm last_logged_in_at set
      const loggedInUser = await db.users.findOne({ email: 'user@email.com' });
      const lastFailedLogin = get(loggedInUser, `[0].flags[${FLAG_LAST_FAILED_LOGIN}]`);
      const failedLoginCount = get(loggedInUser, `[0].flags[${FLAG_FAILED_LOGIN_COUNT}]`);

      expect(loggedInUser.last_logged_in_at).toEqual(new Date('2020-01-01T00:00:00.000Z'));
      expect(lastFailedLogin).toBe(undefined);
      expect(failedLoginCount).toBe(undefined);
    });

    // ---------------------------------------------------------------------------------------------

    it('should error when incorrect email', async () => {
      const response = await agent
        .post('/api/public/login')
        .send({
          email: 'incorrect@email.com',
          password: 'password',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should error when incorrect password', async () => {
      await addDefaultUser(db, {
        userOverride: {
          password: 'bad_password',
        },
      });

      const response = await agent
        .post('/api/public/login')
        .send({
          email: 'user@email.com',
          password: 'password',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();

      const user = await db.users.find({ email: 'user@email.com' });
      const lastFailedLogin = get(user, `[0].flags[${FLAG_LAST_FAILED_LOGIN}]`);
      const failedLoginCount = get(user, `[0].flags[${FLAG_FAILED_LOGIN_COUNT}]`);

      expect(lastFailedLogin).toMatchSnapshot();
      expect(failedLoginCount).toBe(1);
    });

    // ---------------------------------------------------------------------------------------------

    it('should error when account is locked out', async () => {
      await addDefaultUser(db, {
        userOverride: {
          flags: {
            [FLAG_LAST_FAILED_LOGIN]: moment().format(),
            [FLAG_FAILED_LOGIN_COUNT]: getConfig('security', 'failedLoginMaxAttempts'),
          },
        },
      });

      const response = await agent
        .post('/api/public/login')
        .send({
          email: 'user@email.com',
          password: 'password',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();

      const user = await db.users.find({ email: 'user@email.com' });
      const lastFailedLogin = get(user, `[0].flags[${FLAG_LAST_FAILED_LOGIN}]`);
      const failedLoginCount = get(user, `[0].flags[${FLAG_FAILED_LOGIN_COUNT}]`);

      expect(lastFailedLogin).toMatchSnapshot();
      expect(failedLoginCount).toBe(11);
    });
  });

  // ===============================================================================================

  describe('POST /public/reset-password', () => {
    it('should validate form', async () => {
      const response = await agent
        .post('/api/public/reset-password')
        .send({
          email: 'not a valid email address',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should 204 when user not found', async () => {
      await agent
        .post('/api/public/reset-password')
        .send({
          email: 'SirNotAppearingInThisFilm@email.com',
        })
        .expect(204);
    });

    // ---------------------------------------------------------------------------------------------

    it('should create reset token and send email', async () => {
      await addDefaultUser(db);

      await agent
        .post('/api/public/reset-password')
        .send({
          email: 'user@email.com',
        })
        .expect(204);

      const user = await db.users.find({ email: 'user@email.com' });
      const resetToken = get(user, '[0].secure_flags.passwordResetToken');
      const resetTokenDate = get(user, '[0].secure_flags.passwordResetTokenGeneratedAt');

      // Token must be valid date
      expect(isISO8601(resetTokenDate)).toBe(true);

      // Sent email must contain reset token from user
      expect(nodemailerMock.mock.getSentMail()[0].html)
        .toEqual(expect.stringContaining(resetToken));
    });

    // ---------------------------------------------------------------------------------------------

    it('should not send reset password too quickly', async () => {
      await addDefaultUser(db, {
        userOverride: {
          secure_flags: {
            passwordResetToken: 'token',
            passwordResetTokenGeneratedAt: moment().subtract(4, 'minutes').format(),
          },
        },
      });

      await agent
        .post('/api/public/reset-password')
        .send({
          email: 'user@email.com',
        })
        .expect(204);

      // Email must not have been sent
      expect(nodemailerMock.mock.getSentMail()).toHaveLength(0);
    });
  });

  // ===============================================================================================

  describe('POST /public/change-password', () => {
    it('should validate form', async () => {
      const response = await agent
        .post('/api/public/change-password')
        .send({
          token: '',
          password: 'abc',
          password_repeat: 'def',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should change password', async () => {
      await addDefaultUser(db, {
        userOverride: {
          secure_flags: {
            passwordResetToken: 'token',
            passwordResetTokenGeneratedAt: moment().subtract(23, 'hours').format(),
          },
        },
      });

      await agent
        .post('/api/public/change-password')
        .send({
          token: 'token',
          password: 'new_password',
          password_repeat: 'new_password',
        })
        .expect(204);

      const userRow = await db.users.findOne({ email: 'user@email.com' });

      expect(await compare('new_password', userRow.password)).toBe(true);
      expect(typeof userRow.secure_flags.passwordResetToken).toBe('undefined');
      expect(typeof userRow.secure_flags.passwordResetTokenGeneratedAt).toBe('undefined');
      expect(userRow.jwt_series).toBe(2);
    });

    // ---------------------------------------------------------------------------------------------

    it('should error when token not found', async () => {
      const response = await agent
        .post('/api/public/change-password')
        .send({
          token: 'token',
          password: 'new_password',
          password_repeat: 'new_password',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should error when token expired', async () => {
      await addDefaultUser(db, {
        userOverride: {
          secure_flags: {
            passwordResetToken: 'token',
            passwordResetTokenGeneratedAt: moment().subtract(25, 'hours').format(),
          },
        },
      });

      const response = await agent
        .post('/api/public/change-password')
        .send({
          token: 'token',
          password: 'new_password',
          password_repeat: 'new_password',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });
  });
  // ===============================================================================================

  describe('POST /public/confirm-email', () => {
    it('should validate form', async () => {
      const response = await agent
        .post('/api/public/confirm-email')
        .send({
          token: '',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should mark email as confirmed', async () => {
      await addDefaultUser(db, {
        userOverride: {
          secure_flags: {
            creationToken: 'token',
            creationTokenGeneratedAt: moment().subtract(23, 'hours').format(),
          },
        },
      });

      await agent
        .post('/api/public/confirm-email')
        .send({
          token: 'token',
        })
        .expect(204);

      const userRow = await db.users.findOne({ email: 'user@email.com' });

      expect(typeof userRow.secure_flags.creationToken).toBe('undefined');
      expect(typeof userRow.secure_flags.creationTokenGeneratedAt).toBe('undefined');
      expect(userRow.email_confirmed).toBe(true);
    });

    // ---------------------------------------------------------------------------------------------

    it('should error when token not found', async () => {
      const response = await agent
        .post('/api/public/confirm-email')
        .send({
          token: 'token',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should error when token expired', async () => {
      await addDefaultUser(db, {
        userOverride: {
          secure_flags: {
            creationToken: 'token',
            creationTokenGeneratedAt: moment().subtract(25, 'hours').format(),
          },
        },
      });

      const response = await agent
        .post('/api/public/confirm-email')
        .send({
          token: 'token',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });
  });
});
