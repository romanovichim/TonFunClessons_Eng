"use strict";

var _doesNotExist = _interopRequireDefault(require("./does-not-exist"));
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
 */

// $FlowExpectedError[cannot-resolve-module]

// $FlowExpectedError[cannot-resolve-module]

global.x = _doesNotExist.default;
