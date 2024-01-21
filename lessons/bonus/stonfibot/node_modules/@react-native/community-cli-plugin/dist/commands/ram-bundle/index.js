"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = void 0;
var _RamBundle = _interopRequireDefault(
  require("metro/src/shared/output/RamBundle")
);
var _bundle = _interopRequireDefault(require("../bundle"));
var _buildBundle = _interopRequireDefault(require("../bundle/buildBundle"));
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

const ramBundleCommand = {
  name: "ram-bundle",
  description:
    "Build the RAM bundle for the provided JavaScript entry file. See https://reactnative.dev/docs/ram-bundles-inline-requires.",
  func: (argv, config, args) => {
    return (0, _buildBundle.default)(argv, config, args, _RamBundle.default);
  },
  options: [
    // $FlowFixMe[incompatible-type] options is nonnull
    ..._bundle.default.options,
    {
      name: "--indexed-ram-bundle",
      description:
        'Force the "Indexed RAM" bundle file format, even when building for android',
      default: false,
    },
  ],
};
var _default = ramBundleCommand;
exports.default = _default;
