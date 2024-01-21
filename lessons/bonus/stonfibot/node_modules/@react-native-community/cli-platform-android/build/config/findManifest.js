"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = findManifest;
function _glob() {
  const data = _interopRequireDefault(require("glob"));
  _glob = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
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

function findManifest(folder) {
  let manifestPaths = _glob().default.sync(_path().default.join('**', 'AndroidManifest.xml'), {
    cwd: folder,
    ignore: ['node_modules/**', '**/build/**', '**/debug/**', 'Examples/**', 'examples/**', '**/Pods/**', '**/sdks/hermes/android/**', '**/src/androidTest/**', '**/src/test/**']
  });
  if (manifestPaths.length > 1) {
    // if we have more than one manifest, pick the one in the main folder if present
    const mainManifest = manifestPaths.filter(manifestPath => manifestPath.includes('src/main/'));
    if (mainManifest.length === 1) {
      manifestPaths = mainManifest;
    }
  }
  return manifestPaths[0] ? _path().default.join(folder, manifestPaths[0]) : null;
}

//# sourceMappingURL=findManifest.ts.map