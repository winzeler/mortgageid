const WoodUserInitApi = require('@wood/features/users/api/init');

class UserInitApi extends WoodUserInitApi {
  constructor() {
    super(__dirname);
  }
}

module.exports = UserInitApi;
