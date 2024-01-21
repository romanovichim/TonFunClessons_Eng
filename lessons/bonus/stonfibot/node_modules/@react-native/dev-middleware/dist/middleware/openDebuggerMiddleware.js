"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = openDebuggerMiddleware;
var _url = _interopRequireDefault(require("url"));
var _getDevToolsFrontendUrl = _interopRequireDefault(
  require("../utils/getDevToolsFrontendUrl")
);
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

const debuggerInstances = new Map();
/**
 * Open the JavaScript debugger for a given CDP target (direct Hermes debugging).
 *
 * Currently supports Hermes targets, opening debugger websocket URL in Chrome
 * DevTools.
 *
 * @see https://chromedevtools.github.io/devtools-protocol/
 */
function openDebuggerMiddleware({
  serverBaseUrl,
  logger,
  browserLauncher,
  eventReporter,
  experiments,
  inspectorProxy,
}) {
  return async (req, res, next) => {
    if (
      req.method === "POST" ||
      (experiments.enableOpenDebuggerRedirect && req.method === "GET")
    ) {
      const { query } = _url.default.parse(req.url, true);
      const { appId } = query;
      const targets = inspectorProxy.getPageDescriptions().filter(
        // Only use targets with better reloading support
        (app) =>
          app.title === "React Native Experimental (Improved Chrome Reloads)"
      );
      let target;
      const launchType = req.method === "POST" ? "launch" : "redirect";
      if (typeof appId === "string") {
        logger?.info(
          (launchType === "launch" ? "Launching" : "Redirecting to") +
            " JS debugger (experimental)..."
        );
        target = targets.find((_target) => _target.description === appId);
      } else {
        logger?.info(
          (launchType === "launch" ? "Launching" : "Redirecting to") +
            " JS debugger for first available target..."
        );
        target = targets[0];
      }
      if (!target) {
        res.writeHead(404);
        res.end("Unable to find Chrome DevTools inspector target");
        logger?.warn(
          "No compatible apps connected. JavaScript debugging can only be used with the Hermes engine."
        );
        eventReporter?.logEvent({
          type: "launch_debugger_frontend",
          launchType,
          status: "coded_error",
          errorCode: "NO_APPS_FOUND",
        });
        return;
      }
      try {
        switch (launchType) {
          case "launch":
            await debuggerInstances.get(appId)?.kill();
            debuggerInstances.set(
              appId,
              await browserLauncher.launchDebuggerAppWindow(
                (0, _getDevToolsFrontendUrl.default)(
                  experiments,
                  target.webSocketDebuggerUrl,
                  serverBaseUrl
                )
              )
            );
            res.end();
            break;
          case "redirect":
            res.writeHead(302, {
              Location: (0, _getDevToolsFrontendUrl.default)(
                experiments,
                target.webSocketDebuggerUrl,
                // Use a relative URL.
                ""
              ),
            });
            res.end();
            break;
          default:
        }
        eventReporter?.logEvent({
          type: "launch_debugger_frontend",
          launchType,
          status: "success",
          appId,
        });
        return;
      } catch (e) {
        logger?.error(
          "Error launching JS debugger: " + e.message ?? "Unknown error"
        );
        res.writeHead(500);
        res.end();
        eventReporter?.logEvent({
          type: "launch_debugger_frontend",
          launchType,
          status: "error",
          error: e,
        });
        return;
      }
    }
    next();
  };
}
