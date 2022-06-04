const { resolve } = require('path');
require('dotenv').config({ path: resolve(__dirname, '../../.env') });

require('module-alias/register');
require('./Require');

const http = require('http');
const { isNaN } = require('lodash');
const logger = require('pino')({ level: process.env.LOG_LEVEL || 'info' });
const { AppBuilder } = require('#api/AppBuilder');

/**
 * Start the API server.
 *
 * @param {Function} modifyServer - An async function that can modify the server before .listen()
 *                                  is called.
 */
async function startServer(modifyServer = () => {}) {
  const port = normalizePort(process.env.PORT || '3000');

  try {
    const builder = new AppBuilder();
    const app = await builder.getApp();

    app.set('port', port);

    const server = http.createServer(app);
    await modifyServer(server, app);
    server.listen(port);

    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof port === 'string'
        ? `Pipe ${port}`
        : `Port ${port}`;

      // handle specific listen errors with friendly messages
      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    server.on('listening', () => {
      const addr = server.address();
      const bind = typeof addr === 'string'
        ? `pipe ${addr}`
        : `port ${addr.port}`;
      logger.info(`Express app listening on port ${bind}. 🌲`);
    });
  }
  catch (err) {
    logger.error(err);
  }
}

/**
 * Normalize a port into a number, string, or false.
 *
 * @param {Number} val - The port to normalize.
 *
 * @return {Mixed}
 */
function normalizePort(val) {
  const normalPort = parseInt(val, 10);

  if (isNaN(normalPort)) {
    // Named pipe
    return val;
  }

  if (normalPort >= 0) {
    // Port number
    return normalPort;
  }

  return false;
}

module.exports = {
  startServer,
};
