"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBunVersionIfAvailable = getBunVersionIfAvailable;
exports.isProjectUsingBun = isProjectUsingBun;
function _cliTools() {
  const data = require("@react-native-community/cli-tools");
  _cliTools = function () {
    return data;
  };
  return data;
}
function _child_process() {
  const data = require("child_process");
  _child_process = function () {
    return data;
  };
  return data;
}
function _findUp() {
  const data = _interopRequireDefault(require("find-up"));
  _findUp = function () {
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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function getBunVersionIfAvailable() {
  let bunVersion;
  try {
    bunVersion = ((0, _child_process().execSync)('bun --version', {
      stdio: [0, 'pipe', 'ignore']
    }).toString() || '').trim();
  } catch (error) {
    return null;
  }
  try {
    if (_semver().default.gte(bunVersion, '1.0.0')) {
      return bunVersion;
    }
    return null;
  } catch (error) {
    _cliTools().logger.error(`Cannot parse bun version: ${bunVersion}`);
    return null;
  }
}
function isProjectUsingBun(cwd) {
  return _findUp().default.sync('bun.lockb', {
    cwd
  });
}

//# sourceMappingURL=bun.ts.map