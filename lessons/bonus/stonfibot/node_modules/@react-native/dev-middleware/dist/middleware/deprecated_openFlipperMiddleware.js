"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = deprecated_openFlipperMiddleware;
var _open = _interopRequireDefault(require("open"));
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

const FLIPPER_SELF_CONNECT_URL =
  "flipper://null/Hermesdebuggerrn?device=React%20Native";
/**
 * Open the legacy Flipper debugger (Hermes).
 *
 * @deprecated This replicates the pre-0.73 workflow of opening Flipper via the
 * `flipper://` URL scheme, failing if Flipper is not installed locally. This
 * flow will be removed in a future version.
 */
function deprecated_openFlipperMiddleware({ logger }) {
  return async (req, res, next) => {
    if (req.method === "POST") {
      logger?.info("Launching JS debugger...");
      try {
        logger?.warn(
          "Attempting to debug JS in Flipper (deprecated). This requires " +
            "Flipper to be installed on your system to handle the " +
            "'flipper://' URL scheme."
        );
        await (0, _open.default)(FLIPPER_SELF_CONNECT_URL);
        res.end();
      } catch (e) {
        logger?.error(
          "Error launching Flipper: " + e.message ?? "Unknown error"
        );
        res.writeHead(500);
        res.end();
      }
    }
  };
}
