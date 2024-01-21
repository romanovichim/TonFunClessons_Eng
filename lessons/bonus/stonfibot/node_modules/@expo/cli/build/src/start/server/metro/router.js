"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getAppRouterRelativeEntryPath = getAppRouterRelativeEntryPath;
exports.getRouterDirectoryModuleIdWithManifest = getRouterDirectoryModuleIdWithManifest;
exports.getRouterDirectory = getRouterDirectory;
exports.isApiRouteConvention = isApiRouteConvention;
exports.getApiRoutesForDirectory = getApiRoutesForDirectory;
exports.getRoutePaths = getRoutePaths;
exports.hasWarnedAboutApiRoutes = hasWarnedAboutApiRoutes;
exports.warnInvalidWebOutput = warnInvalidWebOutput;
var _chalk = _interopRequireDefault(require("chalk"));
var _glob = require("glob");
var _path = _interopRequireDefault(require("path"));
var _resolveFrom = _interopRequireDefault(require("resolve-from"));
var _log = require("../../../log");
var _dir = require("../../../utils/dir");
var _fn = require("../../../utils/fn");
var _link = require("../../../utils/link");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const debug = require("debug")("expo:start:server:metro:router");
function getAppRouterRelativeEntryPath(projectRoot, routerDirectory = getRouterDirectory(projectRoot)) {
    var ref;
    // Auto pick App entry
    const routerEntry = (ref = _resolveFrom.default.silent(projectRoot, "expo-router/entry")) != null ? ref : getFallbackEntryRoot(projectRoot);
    if (!routerEntry) {
        return undefined;
    }
    // It doesn't matter if the app folder exists.
    const appFolder = _path.default.join(projectRoot, routerDirectory);
    const appRoot = _path.default.relative(_path.default.dirname(routerEntry), appFolder);
    debug("expo-router entry", routerEntry, appFolder, appRoot);
    return appRoot;
}
/** If the `expo-router` package is not installed, then use the `expo` package to determine where the node modules are relative to the project. */ function getFallbackEntryRoot(projectRoot) {
    const expoRoot = _resolveFrom.default.silent(projectRoot, "expo/package.json");
    if (expoRoot) {
        return _path.default.join(_path.default.dirname(_path.default.dirname(expoRoot)), "expo-router/entry");
    }
    return _path.default.join(projectRoot, "node_modules/expo-router/entry");
}
function getRouterDirectoryModuleIdWithManifest(projectRoot, exp) {
    var ref, ref1;
    var ref2;
    return (ref2 = (ref = exp.extra) == null ? void 0 : (ref1 = ref.router) == null ? void 0 : ref1.root) != null ? ref2 : getRouterDirectory(projectRoot);
}
const logSrcDir = (0, _fn).memoize(()=>_log.Log.log(_chalk.default.gray("Using src/app as the root directory for Expo Router."))
);
function getRouterDirectory(projectRoot) {
    // more specific directories first
    if ((0, _dir).directoryExistsSync(_path.default.join(projectRoot, "src/app"))) {
        logSrcDir();
        return "src/app";
    }
    debug("Using app as the root directory for Expo Router.");
    return "app";
}
function isApiRouteConvention(name) {
    return /\+api\.[tj]sx?$/.test(name);
}
function getApiRoutesForDirectory(cwd) {
    return (0, _glob).sync("**/*+api.@(ts|tsx|js|jsx)", {
        cwd,
        absolute: true
    });
}
function getRoutePaths(cwd) {
    return (0, _glob).sync("**/*.@(ts|tsx|js|jsx)", {
        cwd
    }).map((p)=>"./" + normalizePaths(p)
    );
}
function normalizePaths(p) {
    return p.replace(/\\/g, "/");
}
let hasWarnedAboutApiRouteOutput = false;
function hasWarnedAboutApiRoutes() {
    return hasWarnedAboutApiRouteOutput;
}
function warnInvalidWebOutput() {
    if (!hasWarnedAboutApiRouteOutput) {
        _log.Log.warn(_chalk.default.yellow`Using API routes requires the {bold web.output} to be set to {bold "server"} in the project {bold app.json}. ${(0, _link).learnMore("https://docs.expo.dev/router/reference/api-routes/")}`);
    }
    hasWarnedAboutApiRouteOutput = true;
}

//# sourceMappingURL=router.js.map