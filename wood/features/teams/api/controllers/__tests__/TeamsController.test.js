const request = require('supertest');
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
const { overrideConfig } = require('#lib/Config');
const { AppBuilder } = require('#api/AppBuilder');

let app;
let db;
let server;
let agent;

describe('TeamsController', () => {
  beforeAll(async () => {
    overrideConfig('app', 'features.wood', ['users', 'teams']);
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
  });

  afterEach(async () => {
    MockDate.reset();
  });

  afterAll(async () => {
    await connection.destroy();
    await server.close();
    await db.instance.$pool.end();
  });

  // ===============================================================================================

  describe('PUT /team', () => {
    it('should validate the request', async () => {
      const response = await agent
        .put('/api/team')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({ name: '' })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should ensure user has permission to change team name', async () => {
      const response = await agent
        .put('/api/team')
        .set('Cookie', COOKIE_JWT_MEMBER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({ name: 'name' })
        .expect(401);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should change team name', async () => {
      await agent
        .put('/api/team')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({ name: 'new_name' })
        .expect(204);

      const team = await db.teams.findOne({ id: 1 });
      expect(team.name).toBe('new_name');
    });
  });
});
