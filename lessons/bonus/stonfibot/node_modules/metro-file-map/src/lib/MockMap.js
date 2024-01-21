"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = void 0;
var _fast_path = require("./fast_path");
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

class MockMap {
  #raw;
  #rootDir;
  constructor({ rawMockMap, rootDir }) {
    this.#raw = rawMockMap;
    this.#rootDir = rootDir;
  }
  getMockModule(name) {
    const mockPath = this.#raw.get(name) || this.#raw.get(name + "/index");
    return mockPath != null
      ? (0, _fast_path.resolve)(this.#rootDir, mockPath)
      : null;
  }
}
exports.default = MockMap;
