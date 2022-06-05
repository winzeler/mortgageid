const massive = require('massive');
const monitor = require('pg-monitor');

/**
 * Get an insance of the MassiveJS DB connection.
 *
 * @return {MassiveJS}
 */
async function getDb() {
  const db = await massive({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DB,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
  });

  if (process.env.DB_LOGGING) {
    monitor.attach(db.driverConfig);
  }

  return db;
}

module.exports = {
  getDb,
};
