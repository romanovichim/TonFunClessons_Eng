"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = attachKeyHandlers;
var _cliTools = require("@react-native-community/cli-tools");
var _chalk = _interopRequireDefault(require("chalk"));
var _execa = _interopRequireDefault(require("execa"));
var _nodeFetch = _interopRequireDefault(require("node-fetch"));
var _KeyPressHandler = require("../../utils/KeyPressHandler");
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

const CTRL_C = "\u0003";
const CTRL_D = "\u0004";
function attachKeyHandlers({
  cliConfig,
  devServerUrl,
  messageSocket,
  experimentalDebuggerFrontend,
}) {
  if (process.stdin.isTTY !== true) {
    _cliTools.logger.debug(
      "Interactive mode is not supported in this environment"
    );
    return;
  }
  const execaOptions = {
    env: {
      FORCE_COLOR: _chalk.default.supportsColor ? "true" : "false",
    },
  };
  const keyPressHandler = new _KeyPressHandler.KeyPressHandler(async (key) => {
    switch (key) {
      case "r":
        messageSocket.broadcast("reload", null);
        _cliTools.logger.info("Reloading connected app(s)...");
        break;
      case "d":
        messageSocket.broadcast("devMenu", null);
        _cliTools.logger.info("Opening Dev Menu...");
        break;
      case "i":
        _cliTools.logger.info("Opening app on iOS...");
        (0, _execa.default)(
          "npx",
          [
            "react-native",
            "run-ios",
            ...(cliConfig.project.ios?.watchModeCommandParams ?? []),
          ],
          execaOptions
        ).stdout?.pipe(process.stdout);
        break;
      case "a":
        _cliTools.logger.info("Opening app on Android...");
        (0, _execa.default)(
          "npx",
          [
            "react-native",
            "run-android",
            ...(cliConfig.project.android?.watchModeCommandParams ?? []),
          ],
          execaOptions
        ).stdout?.pipe(process.stdout);
        break;
      case "j":
        if (!experimentalDebuggerFrontend) {
          return;
        }
        await (0, _nodeFetch.default)(devServerUrl + "/open-debugger", {
          method: "POST",
        });
        break;
      case CTRL_C:
      case CTRL_D:
        _cliTools.logger.info("Stopping server");
        keyPressHandler.stopInterceptingKeyStrokes();
        process.emit("SIGINT");
        process.exit();
    }
  });
  keyPressHandler.createInteractionListener();
  keyPressHandler.startInterceptingKeyStrokes();
  _cliTools.logger.log(
    [
      "",
      `${_chalk.default.bold("i")} - run on iOS`,
      `${_chalk.default.bold("a")} - run on Android`,
      `${_chalk.default.bold("d")} - open Dev Menu`,
      ...(experimentalDebuggerFrontend
        ? [
            `${_chalk.default.bold(
              "j"
            )} - open debugger (experimental, Hermes only)`,
          ]
        : []),
      `${_chalk.default.bold("r")} - reload app`,
      "",
    ].join("\n")
  );
}
