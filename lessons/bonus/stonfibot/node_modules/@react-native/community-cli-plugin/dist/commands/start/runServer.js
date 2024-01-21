"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = void 0;
var _chalk = _interopRequireDefault(require("chalk"));
var _metro = _interopRequireDefault(require("metro"));
var _metroCore = require("metro-core");
var _path = _interopRequireDefault(require("path"));
var _devMiddleware = require("@react-native/dev-middleware");
var _cliServerApi = require("@react-native-community/cli-server-api");
var _cliTools = require("@react-native-community/cli-tools");
var _isDevServerRunning = _interopRequireDefault(
  require("../../utils/isDevServerRunning")
);
var _loadMetroConfig = _interopRequireDefault(
  require("../../utils/loadMetroConfig")
);
var _attachKeyHandlers = _interopRequireDefault(require("./attachKeyHandlers"));
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

async function runServer(_argv, ctx, args) {
  const metroConfig = await (0, _loadMetroConfig.default)(ctx, {
    config: args.config,
    maxWorkers: args.maxWorkers,
    port: args.port ?? 8081,
    resetCache: args.resetCache,
    watchFolders: args.watchFolders,
    projectRoot: args.projectRoot,
    sourceExts: args.sourceExts,
  });
  const host = args.host?.length ? args.host : "localhost";
  const {
    projectRoot,
    server: { port },
    watchFolders,
  } = metroConfig;
  const scheme = args.https === true ? "https" : "http";
  const devServerUrl = `${scheme}://${host}:${port}`;
  _cliTools.logger.info(`Welcome to React Native v${ctx.reactNativeVersion}`);
  const serverStatus = await (0, _isDevServerRunning.default)(
    scheme,
    host,
    port,
    projectRoot
  );
  if (serverStatus === "matched_server_running") {
    _cliTools.logger.info(
      `A dev server is already running for this project on port ${port}. Exiting.`
    );
    return;
  } else if (serverStatus === "port_taken") {
    _cliTools.logger.error(
      `Another process is running on port ${port}. Please terminate this ` +
        'process and try again, or use another port with "--port".'
    );
    return;
  }
  _cliTools.logger.info(
    `Starting dev server on port ${_chalk.default.bold(String(port))}...`
  );
  if (args.assetPlugins) {
    // $FlowIgnore[cannot-write] Assigning to readonly property
    metroConfig.transformer.assetPlugins = args.assetPlugins.map((plugin) =>
      require.resolve(plugin)
    );
  }
  const {
    middleware: communityMiddleware,
    websocketEndpoints: communityWebsocketEndpoints,
    messageSocketEndpoint,
    eventsSocketEndpoint,
  } = (0, _cliServerApi.createDevServerMiddleware)({
    host,
    port,
    watchFolders,
  });
  const { middleware, websocketEndpoints } = (0,
  _devMiddleware.createDevMiddleware)({
    projectRoot,
    serverBaseUrl: devServerUrl,
    logger: _cliTools.logger,
    unstable_experiments: {
      // NOTE: Only affects the /open-debugger endpoint
      enableNewDebugger: args.experimentalDebugger,
    },
  });
  let reportEvent;
  const terminal = new _metroCore.Terminal(process.stdout);
  const ReporterImpl = getReporterImpl(args.customLogReporterPath);
  const terminalReporter = new ReporterImpl(terminal);
  // $FlowIgnore[cannot-write] Assigning to readonly property
  metroConfig.reporter = {
    update(event) {
      terminalReporter.update(event);
      if (reportEvent) {
        reportEvent(event);
      }
      if (args.interactive && event.type === "initialize_done") {
        _cliTools.logger.info("Dev server ready");
        (0, _attachKeyHandlers.default)({
          cliConfig: ctx,
          devServerUrl,
          messageSocket: messageSocketEndpoint,
          experimentalDebuggerFrontend: args.experimentalDebugger,
        });
      }
    },
  };
  const serverInstance = await _metro.default.runServer(metroConfig, {
    host: args.host,
    secure: args.https,
    secureCert: args.cert,
    secureKey: args.key,
    unstable_extraMiddleware: [
      communityMiddleware,
      _cliServerApi.indexPageMiddleware,
      middleware,
    ],
    websocketEndpoints: {
      ...communityWebsocketEndpoints,
      ...websocketEndpoints,
    },
  });
  reportEvent = eventsSocketEndpoint.reportEvent;

  // In Node 8, the default keep-alive for an HTTP connection is 5 seconds. In
  // early versions of Node 8, this was implemented in a buggy way which caused
  // some HTTP responses (like those containing large JS bundles) to be
  // terminated early.
  //
  // As a workaround, arbitrarily increase the keep-alive from 5 to 30 seconds,
  // which should be enough to send even the largest of JS bundles.
  //
  // For more info: https://github.com/nodejs/node/issues/13391
  //
  serverInstance.keepAliveTimeout = 30000;
  await _cliTools.version.logIfUpdateAvailable(ctx.root);
}
function getReporterImpl(customLogReporterPath) {
  if (customLogReporterPath == null) {
    return require("metro/src/lib/TerminalReporter");
  }
  try {
    // First we let require resolve it, so we can require packages in node_modules
    // as expected. eg: require('my-package/reporter');
    // $FlowIgnore[unsupported-syntax]
    return require(customLogReporterPath);
  } catch (e) {
    if (e.code !== "MODULE_NOT_FOUND") {
      throw e;
    }
    // If that doesn't work, then we next try relative to the cwd, eg:
    // require('./reporter');
    // $FlowIgnore[unsupported-syntax]
    return require(_path.default.resolve(customLogReporterPath));
  }
}
var _default = runServer;
exports.default = _default;
