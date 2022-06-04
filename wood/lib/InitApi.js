const recursive = require('recursive-readdir');

const controllerFilenameRegExp = /features\/(.*).js+$/;
const LOCATION_INDEX = 1;

class InitApi {
  /**
   * Constructor.
   *
   * @param {String} featureDir - The directory this feature is located in.
   */
  constructor(featureDir) {
    if (! featureDir) {
      throw new Error(`Feature '${this.constructor.name}' must pass feature directory to super constructor.`);
    }

    this.featureDir = featureDir;
  }

  /**
   * Get controllers for this feature.
   *
   * @param {Express} app - The Express app.
   *
   * @return {Array<Controller>}
   */
  async getControllers(app) {
    const controllerFilenames = await recursive(
      this.featureDir,
      [(file, stats) => stats.isFile() && ! file.endsWith('Controller.js')],
    );

    return Promise.all(controllerFilenames.map(async (controllerFilename) => {
      const Controller = require(this.rewriteController(controllerFilename)); // eslint-disable-line
      return new Controller({
        db: app.get('db'),
        mailer: app.get('mailer'),
      });
    }));
  }

  /**
   * Rewrites a controller filename to a format that allows for pass-through requiring.
   *
   * @param {String} filename - The controller filename to rewrite.
   *
   * @return {String}
   */
  rewriteController(filename) {
    const controllerLocation = controllerFilenameRegExp.exec(filename)[LOCATION_INDEX];

    return `#features/${controllerLocation}`;
  }
}

module.exports = {
  InitApi,
};
