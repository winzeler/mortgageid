const { InitApi } = require('#lib/InitApi');

class VconnectsInitApi extends InitApi {
  constructor() {
    super(__dirname);
  }
}

module.exports = VconnectsInitApi;
