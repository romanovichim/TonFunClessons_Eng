"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = isDevServerRunning;
var _net = _interopRequireDefault(require("net"));
var _nodeFetch = _interopRequireDefault(require("node-fetch"));
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

/**
 * Determine whether we can run the dev server.
 *
 * Return values:
 * - `not_running`: The port is unoccupied.
 * - `matched_server_running`: The port is occupied by another instance of this
 *   dev server (matching the passed `projectRoot`).
 * - `port_taken`: The port is occupied by another process.
 * - `unknown`: An error was encountered; attempt server creation anyway.
 */
async function isDevServerRunning(scheme, host, port, projectRoot) {
  try {
    if (!(await isPortOccupied(host, port))) {
      return "not_running";
    }
    const statusResponse = await (0, _nodeFetch.default)(
      `${scheme}://${host}:${port}/status`
    );
    const body = await statusResponse.text();
    return body === "packager-status:running" &&
      statusResponse.headers.get("X-React-Native-Project-Root") === projectRoot
      ? "matched_server_running"
      : "port_taken";
  } catch (e) {
    return "unknown";
  }
}
async function isPortOccupied(host, port) {
  let result = false;
  const server = _net.default.createServer();
  return new Promise((resolve, reject) => {
    server.once("error", (e) => {
      server.close();
      if (e.code === "EADDRINUSE") {
        result = true;
      } else {
        reject(e);
      }
    });
    server.once("listening", () => {
      result = false;
      server.close();
    });
    server.once("close", () => {
      resolve(result);
    });
    server.listen({
      host,
      port,
    });
  });
}
