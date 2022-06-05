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
const { AppBuilder } = require('#api/AppBuilder');

let app;
let db;
let server;
let agent;

describe('VconnectsController', () => {
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

  describe('GET /vconnects', () => {
    it('should validate the request', async () => {
      const response = await agent
        .get('/api/vconnects')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .query({ page: 'abc', per: 'def' })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should list first page', async () => {
      await db.vconnects.insert([
        { id: 2, name: 'name2' },
        { id: 3, name: 'name3' },
      ]);

      const response = await agent
        .get('/api/vconnects')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .query({ page: 1, per: 2 })
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });
  });

  // ===============================================================================================

  describe('PUT /vconnects/:id', () => {
    it('should validate the request', async () => {
      await db.vconnects.insert({ id: 2, name: 'name' });

      const response = await agent
        .put('/api/vconnects/2')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({
          name: '',
        })
        .expect(400);

      expect(response.body).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should update the vconnect', async () => {
      await db.vconnects.insert({ id: 2, name: 'name' });

      await agent
        .put('/api/vconnects/2')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .send({
          name: 'new name',
        })
        .expect(204);

      const vconnect = await db.vconnects.findOne({ id: 2 });

      expect(vconnect).toMatchSnapshot();
    });
  });

  // ===============================================================================================

  describe('DELETE /vconnects/:id', () => {
    it('should delete a vconnect', async () => {
      await db.vconnects.insert({ id: 2, name: 'name' });

      await agent
        .delete('/api/vconnects/2')
        .set('Cookie', COOKIE_JWT_OWNER_ID_1)
        .set('X-CSRF-TOKEN', CSRF_TOKEN_USER_ID_1)
        .expect(204);

      const vconnect = await db.vconnects.find(2);

      expect(vconnect).toBe(null);
    });
  });
});
