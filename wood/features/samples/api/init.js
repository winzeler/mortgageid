const { InitApi } = require('#lib/InitApi');

class NodewoodSamplesInitApi extends InitApi {
  constructor() {
    super(__dirname);
  }
}

module.exports = NodewoodSamplesInitApi;
