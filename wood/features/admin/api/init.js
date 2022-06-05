const { InitApi } = require('#lib/InitApi');
const { getConfig } = require('#lib/Config');

class NodewoodAdminInitApi extends InitApi {
  constructor() {
    super(__dirname);

    if (! getConfig('app', 'features.wood').includes('users')) {
      throw new Error('Nodewood "admin" feature requires Nodewood "users" feature.');
    }
  }
}

module.exports = NodewoodAdminInitApi;
