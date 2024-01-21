"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getNpmVersionIfAvailable = getNpmVersionIfAvailable;
exports.isProjectUsingNpm = isProjectUsingNpm;
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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function getNpmVersionIfAvailable() {
  let npmVersion;
  try {
    // execSync returns a Buffer -> convert to string
    npmVersion = ((0, _child_process().execSync)('npm --version', {
      stdio: [0, 'pipe', 'ignore']
    }).toString() || '').trim();
    return npmVersion;
  } catch (error) {
    return null;
  }
}
function isProjectUsingNpm(cwd) {
  return _findUp().default.sync('package-lock.json', {
    cwd
  });
}

//# sourceMappingURL=npm.ts.map