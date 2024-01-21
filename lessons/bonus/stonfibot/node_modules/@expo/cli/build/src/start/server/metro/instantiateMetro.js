"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.loadMetroConfigAsync = loadMetroConfigAsync;
exports.instantiateMetroAsync = instantiateMetroAsync;
exports.isWatchEnabled = isWatchEnabled;
var _config = require("@expo/config");
var _metroConfig = require("@expo/metro-config");
var _chalk = _interopRequireDefault(require("chalk"));
var _metroConfig1 = require("metro-config");
var _metroCore = require("metro-core");
var _semver = _interopRequireDefault(require("semver"));
var _url = require("url");
var _metroTerminalReporter = require("./MetroTerminalReporter");
var _createDebugMiddleware = require("./debugging/createDebugMiddleware");
var _runServerFork = require("./runServer-fork");
var _withMetroMultiPlatform = require("./withMetroMultiPlatform");
var _log = require("../../../log");
var _getMetroProperties = require("../../../utils/analytics/getMetroProperties");
var _metroDebuggerMiddleware = require("../../../utils/analytics/metroDebuggerMiddleware");
var _rudderstackClient = require("../../../utils/analytics/rudderstackClient");
var _env = require("../../../utils/env");
var _corsMiddleware = require("../middleware/CorsMiddleware");
var _manifestMiddleware = require("../middleware/ManifestMiddleware");
var _createJsInspectorMiddleware = require("../middleware/inspector/createJsInspectorMiddleware");
var _mutations = require("../middleware/mutations");
var _suppressErrorMiddleware = require("../middleware/suppressErrorMiddleware");
var _platformBundlers = require("../platformBundlers");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function gteSdkVersion(exp, sdkVersion) {
    if (!exp.sdkVersion) {
        return false;
    }
    if (exp.sdkVersion === "UNVERSIONED") {
        return true;
    }
    try {
        return _semver.default.gte(exp.sdkVersion, sdkVersion);
    } catch  {
        throw new Error(`${exp.sdkVersion} is not a valid version. Must be in the form of x.y.z`);
    }
}
async function loadMetroConfigAsync(projectRoot, options, { exp =(0, _config).getConfig(projectRoot, {
    skipSDKVersionRequirement: true
}).exp , isExporting  }) {
    var ref, ref1;
    let reportEvent;
    const serverRoot = (0, _manifestMiddleware).getMetroServerRoot(projectRoot);
    const terminal = new _metroCore.Terminal(process.stdout);
    const terminalReporter = new _metroTerminalReporter.MetroTerminalReporter(serverRoot, terminal);
    const hasConfig = await (0, _metroConfig1).resolveConfig(options.config, projectRoot);
    let config = {
        ...await (0, _metroConfig1).loadConfig({
            cwd: projectRoot,
            projectRoot,
            ...options
        }, // If the project does not have a metro.config.js, then we use the default config.
        hasConfig.isEmpty ? (0, _metroConfig).getDefaultConfig(projectRoot) : undefined),
        reporter: {
            update (event) {
                terminalReporter.update(event);
                if (reportEvent) {
                    reportEvent(event);
                }
            }
        }
    };
    if (// Requires SDK 50 for expo-assets hashAssetPlugin change.
    !exp.sdkVersion || gteSdkVersion(exp, "50.0.0")) {
        if (isExporting) {
            var ref2;
            var ref3;
            // This token will be used in the asset plugin to ensure the path is correct for writing locally.
            // @ts-expect-error: typed as readonly.
            config.transformer.publicPath = `/assets?export_path=${((ref3 = (ref2 = exp.experiments) == null ? void 0 : ref2.baseUrl) != null ? ref3 : "") + "/assets"}`;
        } else {
            // @ts-expect-error: typed as readonly
            config.transformer.publicPath = "/assets/?unstable_path=.";
        }
    } else {
        var ref4;
        if (isExporting && ((ref4 = exp.experiments) == null ? void 0 : ref4.baseUrl)) {
            var ref5;
            // This token will be used in the asset plugin to ensure the path is correct for writing locally.
            // @ts-expect-error: typed as readonly.
            config.transformer.publicPath = (ref5 = exp.experiments) == null ? void 0 : ref5.baseUrl;
        }
    }
    const platformBundlers = (0, _platformBundlers).getPlatformBundlers(projectRoot, exp);
    var ref6, ref7;
    config = await (0, _withMetroMultiPlatform).withMetroMultiPlatformAsync(projectRoot, {
        config,
        exp,
        platformBundlers,
        isTsconfigPathsEnabled: (ref6 = (ref = exp.experiments) == null ? void 0 : ref.tsconfigPaths) != null ? ref6 : true,
        webOutput: (ref7 = (ref1 = exp.web) == null ? void 0 : ref1.output) != null ? ref7 : "single",
        isFastResolverEnabled: _env.env.EXPO_USE_FAST_RESOLVER,
        isExporting
    });
    if (process.env.NODE_ENV !== "test") {
        (0, _rudderstackClient).logEventAsync("metro config", (0, _getMetroProperties).getMetroProperties(projectRoot, exp, config));
    }
    return {
        config,
        setEventReporter: (logger)=>reportEvent = logger
        ,
        reporter: terminalReporter
    };
}
async function instantiateMetroAsync(metroBundler, options, { isExporting  }) {
    const projectRoot = metroBundler.projectRoot;
    // TODO: When we bring expo/metro-config into the expo/expo repo, then we can upstream this.
    const { exp  } = (0, _config).getConfig(projectRoot, {
        skipSDKVersionRequirement: true
    });
    const { config: metroConfig , setEventReporter  } = await loadMetroConfigAsync(projectRoot, options, {
        exp,
        isExporting
    });
    const { createDevServerMiddleware , securityHeadersMiddleware  } = require("@react-native-community/cli-server-api");
    const { middleware , messageSocketEndpoint , eventsSocketEndpoint , websocketEndpoints  } = createDevServerMiddleware({
        port: metroConfig.server.port,
        watchFolders: metroConfig.watchFolders
    });
    // The `securityHeadersMiddleware` does not support cross-origin requests, we replace with the enhanced version.
    (0, _mutations).replaceMiddlewareWith(middleware, securityHeadersMiddleware, (0, _corsMiddleware).createCorsMiddleware(exp));
    (0, _mutations).prependMiddleware(middleware, _suppressErrorMiddleware.suppressRemoteDebuggingErrorMiddleware);
    // TODO: We can probably drop this now.
    const customEnhanceMiddleware = metroConfig.server.enhanceMiddleware;
    // @ts-expect-error: can't mutate readonly config
    metroConfig.server.enhanceMiddleware = (metroMiddleware, server)=>{
        if (customEnhanceMiddleware) {
            metroMiddleware = customEnhanceMiddleware(metroMiddleware, server);
        }
        return middleware.use(metroMiddleware);
    };
    middleware.use((0, _metroDebuggerMiddleware).createDebuggerTelemetryMiddleware(projectRoot, exp));
    // Initialize all React Native debug features
    const { debugMiddleware , debugWebsocketEndpoints  } = (0, _createDebugMiddleware).createDebugMiddleware(metroBundler);
    (0, _mutations).prependMiddleware(middleware, debugMiddleware);
    middleware.use("/_expo/debugger", (0, _createJsInspectorMiddleware).createJsInspectorMiddleware());
    const { server: server1 , metro  } = await (0, _runServerFork).runServer(metroBundler, metroConfig, {
        // @ts-expect-error: Inconsistent `websocketEndpoints` type between metro and @react-native-community/cli-server-api
        websocketEndpoints: {
            ...websocketEndpoints,
            ...debugWebsocketEndpoints
        },
        watch: !isExporting && isWatchEnabled()
    });
    (0, _mutations).prependMiddleware(middleware, (req, res, next)=>{
        // If the URL is a Metro asset request, then we need to skip all other middleware to prevent
        // the community CLI's serve-static from hosting `/assets/index.html` in place of all assets if it exists.
        // /assets/?unstable_path=.
        if (req.url) {
            const url = new _url.URL(req.url, "http://localhost:8000");
            if (url.pathname.match(/^\/assets\/?/) && url.searchParams.get("unstable_path") != null) {
                return metro.processRequest(req, res, next);
            }
        }
        return next();
    });
    setEventReporter(eventsSocketEndpoint.reportEvent);
    return {
        metro,
        server: server1,
        middleware,
        messageSocket: messageSocketEndpoint
    };
}
function isWatchEnabled() {
    if (_env.env.CI) {
        _log.Log.log(_chalk.default`Metro is running in CI mode, reloads are disabled. Remove {bold CI=true} to enable watch mode.`);
    }
    return !_env.env.CI;
}

//# sourceMappingURL=instantiateMetro.js.map