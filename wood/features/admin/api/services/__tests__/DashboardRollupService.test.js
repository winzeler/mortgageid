const MockDate = require('mockdate');
const nodemailerMock = require('nodemailer-mock');
const moment = require('moment');
const { connection, cleanDb } = require('@wood/testHelper');
const { clearConfigOverrides } = require('#lib/Config');
const { getDb } = require('#api/Db');
const { DashboardRollupService } = require('#features/admin/api/services/DashboardRollupService');

let db;
let rollupService;

describe('DashboardRollupService', () => {
  beforeAll(async () => {
    db = await getDb();
    rollupService = new DashboardRollupService({ db });
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

  describe('getStartDate', () => {
    it('should get start date from rollup table if previous entries are present', async () => {
      await db.admin_dashboard_rollups.insert({ day: '2019/12/30' });

      expect(moment(await rollupService.getStartDate()).format()).toEqual('2019-12-31T00:00:00+00:00');
    });

    // ---------------------------------------------------------------------------------------------

    it('should get start date from users if no previous rollup entries', async () => {
      await db.users.insert({
        id: 2,
        created_at: '2019-12-28T08:34:29+00:00',
        email: 'user@email.com',
        password: 'password',
        name: 'name',
        account_type: 'account_type',
        flags: {},
        jwt_series: 1,
      });

      expect(moment(await rollupService.getStartDate()).format()).toEqual('2019-12-28T00:00:00+00:00');
    });

    // ---------------------------------------------------------------------------------------------

    it('should exit if no users', async () => {
      await expect(rollupService.getStartDate())
        .rejects
        .toThrow('No data to rollup.');
    });

    // ---------------------------------------------------------------------------------------------

    it('should exit if start date is today', async () => {
      await db.admin_dashboard_rollups.insert({ day: '2020/01/01' });

      await expect(rollupService.getStartDate())
        .rejects
        .toThrow('Cannot perform rollup on current day.');
    });
  });
});
