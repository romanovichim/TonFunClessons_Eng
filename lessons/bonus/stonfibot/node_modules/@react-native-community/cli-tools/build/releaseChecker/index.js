"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.current = current;
exports.latest = latest;
exports.logIfUpdateAvailable = logIfUpdateAvailable;
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _semver() {
  const data = _interopRequireDefault(require("semver"));
  _semver = function () {
    return data;
  };
  return data;
}
var _errors = require("../errors");
var _logger = _interopRequireDefault(require("../logger"));
var _resolveNodeModuleDir = _interopRequireDefault(require("../resolveNodeModuleDir"));
var _getLatestRelease = _interopRequireDefault(require("./getLatestRelease"));
var _printNewRelease = _interopRequireDefault(require("./printNewRelease"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const getReactNativeVersion = projectRoot => {
  var _require;
  return (_require = require(_path().default.join((0, _resolveNodeModuleDir.default)(projectRoot, 'react-native'), 'package.json'))) === null || _require === void 0 ? void 0 : _require.version;
};

/**
 * Logs out a message if the user's version is behind a stable version of React Native
 */
async function logIfUpdateAvailable(projectRoot) {
  const versions = await latest(projectRoot);
  if (!(versions === null || versions === void 0 ? void 0 : versions.upgrade)) {
    return;
  }
  if (_semver().default.gt(versions.upgrade.stable, versions.current)) {
    (0, _printNewRelease.default)(versions.name, versions.upgrade, versions.current);
  }
}
/**
 * Finds the latest stables version of React Native > current version
 */
async function latest(projectRoot) {
  try {
    const currentVersion = getReactNativeVersion(projectRoot);
    if (!currentVersion) {
      return;
    }
    const {
      name
    } = require(_path().default.join(projectRoot, 'package.json'));
    const upgrade = await (0, _getLatestRelease.default)(name, currentVersion);
    if (upgrade) {
      return {
        name,
        current: currentVersion,
        upgrade
      };
    }
  } catch (e) {
    // We let the flow continue as this component is not vital for the rest of
    // the CLI.
    _logger.default.debug('Cannot detect current version of React Native, ' + 'skipping check for a newer release');
    _logger.default.debug(e);
  }
  return;
}

/**
 * Gets the current project's version parsed as Semver
 */
function current(projectRoot) {
  try {
    const found = _semver().default.parse(getReactNativeVersion(projectRoot));
    if (found) {
      return found;
    }
  } catch {
    throw new _errors.UnknownProjectError(projectRoot);
  }
  return undefined;
}

//# sourceMappingURL=index.ts.map