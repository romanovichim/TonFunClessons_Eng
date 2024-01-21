"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = void 0;
var _path = _interopRequireDefault(require("path"));
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 * @oncall react_native
 */

function getAssetDestPathIOS(asset, scale) {
  const suffix = scale === 1 ? "" : `@${scale}x`;
  const fileName = `${asset.name + suffix}.${asset.type}`;
  return _path.default.join(
    // Assets can have relative paths outside of the project root.
    // Replace `../` with `_` to make sure they don't end up outside of
    // the expected assets directory.
    asset.httpServerLocation.substr(1).replace(/\.\.\//g, "_"),
    fileName
  );
}
var _default = getAssetDestPathIOS;
exports.default = _default;
