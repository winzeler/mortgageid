const { existsSync } = require('fs');
const appConfig = require('../app/config/app');

// Modules, relative to the root directory
const moduleNameMapperRoot = {
  '^@app(.*)$': '<rootDir>/app/$1',
  '^@wood(.*)$': '<rootDir>/wood/$1',
};

// Modules, relative to the 'wood' directory
const moduleNameMapperWood = {
  '^@app(.*)$': '<rootDir>/../app/$1',
  '^@wood(.*)$': '<rootDir>/$1',
};

const featureNameRegExp = /app\/features\/([^/]+)/;
const INDEX_FEATURE_NAME = 1;

/**
 * Get the mapped path for this request or false if not found.
 *
 * @param {String} request - The module path requested.
 * @param {Object} options - The request options.
 *
 * @return {String|boolean}
 */
function getModuleNamePath(request, options) {
  // Choose the correct module name mapper, based on where tests are being run from
  const moduleNameMapper = options.rootDir.substr(-5) === '/wood'
    ? moduleNameMapperWood
    : moduleNameMapperRoot;

  // eslint-disable-next-line no-restricted-syntax
  for (const [regex, path] of Object.entries(moduleNameMapper)) {
    const re = new RegExp(regex);
    const match = request.match(re);
    if (match) {
      return path.replace('<rootDir>', options.rootDir).replace('$1', match[1].substr(1));
    }
  }

  return false;
}

/**
 * Check to see if a filename exists, checking all possible extensions.
 *
 * @param {String} path - The path to the filename.
 * @param {Array} extensions - The extensions to check.
 *
 * @return {Boolean}
 */
function fileExists(path, extensions) {
  // Might have an extension already
  if (existsSync(path)) {
    return path;
  }

  // Otherwise, try all extensions
  // eslint-disable-next-line no-restricted-syntax
  for (const extension of extensions) {
    if (existsSync(`${path}${extension}`)) {
      return `${path}${extension}`;
    }
  }

  return false;
}

/**
 * File to be required is only valid if it is a non-feature file or if it is a feature file for a
 * feature that is currently active.
 *
 * @param {String} appFilenamePath - The filename path to check.
 *
 * @return {Boolean}
 */
function isValidAppFile(appFilenamePath) {
  const found = featureNameRegExp.exec(appFilenamePath);

  // Non-feature file, thus valid
  if (! found) {
    return true;
  }

  const feature = found[INDEX_FEATURE_NAME];

  return appConfig.features.app.includes(feature);
}

/**
 * Resolve a module, properly falling back from `app` to `wood` for modules that start with '~'.
 *
 * @param {String} request - The requested module.
 * @param {Object} options - The options for the resolver.
 *
 * @return {String}
 */
module.exports = function resolver(request, options) {
  if (request.substr(0, 1) === '#') {
    // Try to find file in app namespace
    const appFilenamePath = getModuleNamePath(`@app/${request.substr(1)}`, options);
    const appFileWithExtension = fileExists(appFilenamePath, options.extensions);

    if (appFileWithExtension && isValidAppFile(appFilenamePath)) {
      return appFileWithExtension;
    }

    // Try to find file in wood namespace
    const woodFilenamePath = getModuleNamePath(`@wood/${request.substr(1)}`, options);
    const woodFileWithExtension = fileExists(woodFilenamePath, options.extensions);

    if (woodFileWithExtension) {
      return woodFileWithExtension;
    }
  }

  return options.defaultResolver(request, options);
};
