"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.startTypescriptTypeGenerationAsync = startTypescriptTypeGenerationAsync;
var _config = require("@expo/config");
var _promises = _interopRequireDefault(require("fs/promises"));
var _path = _interopRequireDefault(require("path"));
var _expoEnv = require("./expo-env");
var _routes = require("./routes");
var _tsconfig = require("./tsconfig");
var _mergeGitIgnorePaths = require("../../../utils/mergeGitIgnorePaths");
var _dotExpo = require("../../project/dotExpo");
var _router = require("../metro/router");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const debug = require("debug")("expo:typed-routes");
async function startTypescriptTypeGenerationAsync({ metro , projectRoot , server  }) {
    var ref;
    const { exp  } = (0, _config).getConfig(projectRoot);
    // If typed routes are disabled, remove any files that were added.
    if (!((ref = exp.experiments) == null ? void 0 : ref.typedRoutes)) {
        debug("Removing typed routes side-effects (experiments.typedRoutes: false)");
        const gitIgnorePath = _path.default.join(projectRoot, ".gitignore");
        await Promise.all([
            (0, _tsconfig).forceRemovalTSConfig(projectRoot),
            (0, _expoEnv).removeExpoEnvDTS(projectRoot),
            (0, _mergeGitIgnorePaths).removeFromGitIgnore(gitIgnorePath, "expo-env.d.ts"), 
        ]);
    } else {
        const dotExpoDir = (0, _dotExpo).ensureDotExpoProjectDirectoryInitialized(projectRoot);
        const typesDirectory = _path.default.resolve(dotExpoDir, "./types");
        debug("Ensuring typed routes side-effects are setup (experiments.typedRoutes: true, typesDirectory: %s)", typesDirectory);
        // Ensure the types directory exists.
        await _promises.default.mkdir(typesDirectory, {
            recursive: true
        });
        await Promise.all([
            (0, _mergeGitIgnorePaths).upsertGitIgnoreContents(_path.default.join(projectRoot, ".gitignore"), "expo-env.d.ts"),
            (0, _expoEnv).writeExpoEnvDTS(projectRoot),
            (0, _tsconfig).forceUpdateTSConfig(projectRoot),
            (0, _routes).setupTypedRoutes({
                metro,
                server,
                typesDirectory,
                projectRoot,
                routerDirectory: _path.default.join(projectRoot, (0, _router).getRouterDirectoryModuleIdWithManifest(projectRoot, exp))
            }), 
        ]);
    }
}

//# sourceMappingURL=startTypescriptTypeGeneration.js.map