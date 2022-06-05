const MockDate = require('mockdate');
const nodemailerMock = require('nodemailer-mock');
const { connection, cleanDb } = require('@wood/testHelper');
const { getDb } = require('#api/Db');
const { run } = require('#features/verida-connect/cli/scripts/VeridaConnectScript');

let db;
let mailer;

describe('VeridaConnectScript', () => {
  beforeAll(async () => {
    mailer = nodemailerMock.createTransport({});
    db = await getDb();
  });

  beforeEach(async () => {
    MockDate.set('1/1/2020');
    await cleanDb();
    nodemailerMock.mock.reset();
  });

  afterEach(async () => {
    MockDate.reset();
  });

  afterAll(async () => {
    await connection.destroy();
    await db.instance.$pool.end();
  });

  // ===============================================================================================

  describe('VeridaConnectScript', () => {
    it('should recieve correct arguments', async () => {
      const scriptArgs = ['abc', 'def', 'ghi'];
      const options = { a: true, b: true, c: 'def' };
      const response = await run(scriptArgs, options, { db, mailer });

      expect(response.scriptArgs).toBe(scriptArgs);
      expect(response.options).toBe(options);
      expect(response.db).toBe(db);
      expect(response.mailer).toBe(mailer);
    });
  });
});
