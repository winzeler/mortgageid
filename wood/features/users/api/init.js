const { InitApi } = require('#lib/InitApi');

class NodewoodUsersInitApi extends InitApi {
  constructor() {
    super(__dirname);
  }
}

module.exports = NodewoodUsersInitApi;
