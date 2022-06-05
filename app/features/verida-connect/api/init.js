const { InitApi } = require('#lib/InitApi');

class VeridaConnectsInitApi extends InitApi {
  constructor() {
    super(__dirname);
  }
}

module.exports = VeridaConnectsInitApi;
