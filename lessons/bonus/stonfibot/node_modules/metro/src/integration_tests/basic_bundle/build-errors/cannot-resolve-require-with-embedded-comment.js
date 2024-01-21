"use strict";

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
const DoesNotExist = require("./foo" /* ./foo */);

global.x = DoesNotExist;
