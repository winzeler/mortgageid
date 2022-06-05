const Module = require('module');

const originalRequire = Module.prototype.require;

/**
 * If path for module starts with ~, try to load @app first, then fallback to @wood.
 *
 * This allows us to cleanly fallback from app code to Nodewood code.
 *
 * @param {String} path - The path of the module to require.
 *
 * @return {Module}
 */
Module.prototype.require = function fallbackRequire(path) {
  /* eslint-disable no-underscore-dangle */
  if (path.substr(0, 1) === '#') {
    try {
      // Try to find file in app namespace
      const appPath = Module._resolveFilename(`@app/${path.substr(1)}`, this);
      return originalRequire(appPath);
    }
    catch (error) {
      // Failed to find file, try to find it in Nodewood namespace
      if (error.message.startsWith('Cannot find module')
        && error.message.split('\n')[0].endsWith(`${path.substring(1)}'`)) {
        const woodPath = Module._resolveFilename(`@wood/${path.substr(1)}`, this);
        return originalRequire(woodPath);
      }

      // Any other error should just be thrown
      throw error;
    }
  }

  try {
    // Let Node work its magic
    return originalRequire(Module._resolveFilename(path, this));
  }
  catch (error) {
    console.error(error); // eslint-disable-line no-console
    process.exit(1);
  }

  return false;
  /* eslint-enable */
};
