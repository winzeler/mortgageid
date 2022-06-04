const { get, uniq, assign, isArray, template } = require('lodash');

// When using a dynamic require string, webpack will try to deduce all possible
// files that match the string pattern.  Since we NEVER want to require config-api
// files, we stub out the require function in webpack for those calls.
const apiOnlyRequire = typeof __webpack_require__ === 'function' ? () => {} : require;

const configs = {};
let overrides = {};

/**
 * Gets a configuration value, overriding it if an override is set.
 *
 * @param {String} file - The file in `#config/*` to include the config value from.
 * @param {String} path - The path in the file to the config var to get.
 * @param {Mixed} defaultValue - The default value to return if none provided.
 *
 * @return {Mixed}
 */
function getConfig(file, path, defaultValue) {
  if (! configs[file]) {
    configs[file] = require(`#config/${file}`); // eslint-disable-line global-require, import/no-dynamic-require, max-len
  }

  return getConfigValue(configs[file], overrides[file], path, defaultValue);
}

/**
 * Get a configuration value from the `config-api` folder, overriding if an override is set.
 *
 * @param {String} file - The file in `#config-api/*` to include the config value from.
 * @param {String} path - The path in the file to the config var to get.
 * @param {Mixed} defaultValue - The default value to return if none provided.
 *
 * @return {Mixed}
 */
function getConfigApi(file, path, defaultValue) {
  const apiFile = `api/${file}`;
  if (! configs[apiFile]) {
    configs[apiFile] = apiOnlyRequire(`#config-api/${file}`);
  }

  return getConfigValue(configs[apiFile], overrides[apiFile], path, defaultValue);
}

/**
 * Gets config value `path` from `config`, overriding with same value from `path`, supplementing
 * with `defaultValue` if no config value is present.
 *
 * @param {Object} config - The config object to check for `path`.
 * @param {Object} override - The override object to check for `path`.
 * @param {String} path - The path to check for config values.
 * @param {Mixed} defaultValue - The value to fall back to, if no config value is present.
 *
 * @return {Mixed}
 */
function getConfigValue(config, override, path, defaultValue) {
  // Get a value from the file
  if (path) {
    return get(override, path, get(config, path, defaultValue));
  }

  // Return entire overridden array or base config object
  if (isArray(config)) {
    return override || config;
  }

  // Merge overrides into base config object
  return assign({}, config, override);
}

/**
 * Override a config value.  Useful for testing.
 *
 * @param {String} file - The file in `#config/*` to override the config value from.
 * @param {String} path - The path in the file to the config var to override.
 * @param {Mixed} value - The value to override with.
 */
function overrideConfig(file, path, value) {
  if (! overrides[file]) {
    overrides[file] = {};
  }

  overrides[file][path] = value;
}

/**
 * Overrides an entire config file.  Useful for mocking an entire config file with a fixture.
 *
 * @param {String} file - The filein `#config/*` to override all values from.
 * @param {Object} value - The values to override with.
 */
function overrideConfigFile(file, value) {
  overrides[file] = value;
}

/**
 * Clear all overridden config values.
 */
function clearConfigOverrides() {
  overrides = {};
}

/**
 * Get a list of all enabled features.
 *
 * The features config var is required inside this function so that it can be properly mocked
 * for testing.
 *
 * @return {Array}
 */
function allFeatures() {
  return uniq(getConfig('app', 'features.wood').concat(getConfig('app', 'features.app')));
}

/**
 * If the named feature is enabled either in wood or app.
 *
 * @param {String} name - The name of the feature to check.
 *
 * @return {Boolean}
 */
function isFeatureEnabled(name) {
  return allFeatures().includes(name);
}

/**
 * Gets a templated language string from a file.
 *
 * @param {String} file - The file to read the language string from.
 * @param {String} term - The key from the `language` entry in the file to read the template for.
 * @param {Object} replacements - The terms to replace in the template.
 *
 * @return {String}
 */
function getLanguageString(file, term, replacements = {}) {
  return template(getConfig(file, `language.${term}`, ''))(replacements);
}

module.exports = {
  getConfig,
  getConfigApi,
  overrideConfig,
  overrideConfigFile,
  clearConfigOverrides,
  allFeatures,
  isFeatureEnabled,
  getLanguageString,
};
