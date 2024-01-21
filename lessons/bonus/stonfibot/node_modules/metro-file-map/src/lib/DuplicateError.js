"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.DuplicateError = void 0;
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

class DuplicateError extends Error {
  constructor(mockPath1, mockPath2) {
    super("Duplicated files or mocks. Please check the console for more info");
    this.mockPath1 = mockPath1;
    this.mockPath2 = mockPath2;
  }
}
exports.DuplicateError = DuplicateError;
