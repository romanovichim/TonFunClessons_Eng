"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = createDevMiddleware;
var _debuggerFrontend = _interopRequireDefault(
  require("@react-native/debugger-frontend")
);
var _connect = _interopRequireDefault(require("connect"));
var _path = _interopRequireDefault(require("path"));
var _serveStatic = _interopRequireDefault(require("serve-static"));
var _deprecated_openFlipperMiddleware = _interopRequireDefault(
  require("./middleware/deprecated_openFlipperMiddleware")
);
var _openDebuggerMiddleware = _interopRequireDefault(
  require("./middleware/openDebuggerMiddleware")
);
var _InspectorProxy = _interopRequireDefault(
  require("./inspector-proxy/InspectorProxy")
);
var _DefaultBrowserLauncher = _interopRequireDefault(
  require("./utils/DefaultBrowserLauncher")
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

// $FlowFixMe[untyped-import] TODO: type serve-static

function createDevMiddleware({
  projectRoot,
  serverBaseUrl,
  logger,
  unstable_browserLauncher = _DefaultBrowserLauncher.default,
  unstable_eventReporter,
  unstable_experiments: experimentConfig = {},
  unstable_InspectorProxy,
}) {
  const experiments = getExperiments(experimentConfig);
  const inspectorProxy = new (unstable_InspectorProxy ??
    _InspectorProxy.default)(
    projectRoot,
    serverBaseUrl,
    unstable_eventReporter,
    experiments
  );
  const middleware = (0, _connect.default)()
    .use(
      "/open-debugger",
      experiments.enableNewDebugger
        ? (0, _openDebuggerMiddleware.default)({
            serverBaseUrl,
            inspectorProxy,
            browserLauncher: unstable_browserLauncher,
            eventReporter: unstable_eventReporter,
            experiments,
            logger,
          })
        : (0, _deprecated_openFlipperMiddleware.default)({
            logger,
          })
    )
    .use(
      "/debugger-frontend",
      (0, _serveStatic.default)(_path.default.join(_debuggerFrontend.default), {
        fallthrough: false,
      })
    )
    .use((...args) => inspectorProxy.processRequest(...args));
  return {
    middleware,
    websocketEndpoints: inspectorProxy.createWebSocketListeners(),
  };
}
function getExperiments(config) {
  return {
    enableNewDebugger: config.enableNewDebugger ?? false,
    enableOpenDebuggerRedirect: config.enableOpenDebuggerRedirect ?? false,
    enableNetworkInspector: config.enableNetworkInspector ?? false,
  };
}
