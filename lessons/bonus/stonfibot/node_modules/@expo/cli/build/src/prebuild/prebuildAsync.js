"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.prebuildAsync = prebuildAsync;
var _chalk = _interopRequireDefault(require("chalk"));
var _clearNativeFolder = require("./clearNativeFolder");
var _configureProjectAsync = require("./configureProjectAsync");
var _ensureConfigAsync = require("./ensureConfigAsync");
var _resolveOptions = require("./resolveOptions");
var _updateFromTemplate = require("./updateFromTemplate");
var _installAsync = require("../install/installAsync");
var _log = require("../log");
var _env = require("../utils/env");
var _nodeEnv = require("../utils/nodeEnv");
var _nodeModules = require("../utils/nodeModules");
var _ora = require("../utils/ora");
var _profile = require("../utils/profile");
var _prompts = require("../utils/prompts");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    } else {
        var newObj = {};
        if (obj != null) {
            for(var key in obj){
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};
                    if (desc.get || desc.set) {
                        Object.defineProperty(newObj, key, desc);
                    } else {
                        newObj[key] = obj[key];
                    }
                }
            }
        }
        newObj.default = obj;
        return newObj;
    }
}
const debug = require("debug")("expo:prebuild");
async function prebuildAsync(projectRoot, options) {
    (0, _nodeEnv).setNodeEnv("development");
    require("@expo/env").load(projectRoot);
    if (options.clean) {
        const { maybeBailOnGitStatusAsync  } = await Promise.resolve().then(function() {
            return _interopRequireWildcard(require("../utils/git.js"));
        });
        // Clean the project folders...
        if (await maybeBailOnGitStatusAsync()) {
            return null;
        }
        // Clear the native folders before syncing
        await (0, _clearNativeFolder).clearNativeFolder(projectRoot, options.platforms);
    } else {
        // Check if the existing project folders are malformed.
        await (0, _clearNativeFolder).promptToClearMalformedNativeProjectsAsync(projectRoot, options.platforms);
    }
    // Warn if the project is attempting to prebuild an unsupported platform (iOS on Windows).
    options.platforms = (0, _resolveOptions).ensureValidPlatforms(options.platforms);
    // Assert if no platforms are left over after filtering.
    (0, _resolveOptions).assertPlatforms(options.platforms);
    // Get the Expo config, create it if missing.
    const { exp , pkg  } = await (0, _ensureConfigAsync).ensureConfigAsync(projectRoot, {
        platforms: options.platforms
    });
    // Create native projects from template.
    const { hasNewProjectFiles , needsPodInstall , templateChecksum , changedDependencies  } = await (0, _updateFromTemplate).updateFromTemplateAsync(projectRoot, {
        exp,
        pkg,
        template: options.template != null ? (0, _resolveOptions).resolveTemplateOption(options.template) : undefined,
        platforms: options.platforms,
        skipDependencyUpdate: options.skipDependencyUpdate
    });
    // Install node modules
    if (options.install) {
        if (changedDependencies.length) {
            var ref;
            if ((ref = options.packageManager) == null ? void 0 : ref.npm) {
                await (0, _nodeModules).clearNodeModulesAsync(projectRoot);
            }
            _log.Log.log(_chalk.default.gray(_chalk.default`Dependencies in the {bold package.json} changed:`));
            _log.Log.log(_chalk.default.gray("  " + changedDependencies.join(", ")));
            // Installing dependencies is a legacy feature from the unversioned
            // command. We know opt to not change dependencies unless a template
            // indicates a new dependency is required, or if the core dependencies are wrong.
            if (await (0, _prompts).confirmAsync({
                message: `Install the updated dependencies?`,
                initial: true
            })) {
                var ref1, ref2, ref3, ref4;
                await (0, _installAsync).installAsync([], {
                    npm: !!((ref1 = options.packageManager) == null ? void 0 : ref1.npm),
                    yarn: !!((ref2 = options.packageManager) == null ? void 0 : ref2.yarn),
                    pnpm: !!((ref3 = options.packageManager) == null ? void 0 : ref3.pnpm),
                    bun: !!((ref4 = options.packageManager) == null ? void 0 : ref4.bun),
                    silent: !(_env.env.EXPO_DEBUG || _env.env.CI)
                });
            }
        }
    }
    // Apply Expo config to native projects. Prevent log-spew from ora when running in debug mode.
    const configSyncingStep = _env.env.EXPO_DEBUG ? {
        succeed (text) {
            _log.Log.log(text);
        },
        fail (text) {
            _log.Log.error(text);
        }
    } : (0, _ora).logNewSection("Running prebuild");
    try {
        await (0, _profile).profile(_configureProjectAsync.configureProjectAsync)(projectRoot, {
            platforms: options.platforms,
            exp,
            templateChecksum
        });
        configSyncingStep.succeed("Finished prebuild");
    } catch (error) {
        configSyncingStep.fail("Prebuild failed");
        throw error;
    }
    // Install CocoaPods
    let podsInstalled = false;
    // err towards running pod install less because it's slow and users can easily run npx pod-install afterwards.
    if (options.platforms.includes("ios") && options.install && needsPodInstall) {
        const { installCocoaPodsAsync  } = await Promise.resolve().then(function() {
            return _interopRequireWildcard(require("../utils/cocoapods.js"));
        });
        podsInstalled = await installCocoaPodsAsync(projectRoot);
    } else {
        debug("Skipped pod install");
    }
    return {
        nodeInstall: !!options.install,
        podInstall: !podsInstalled,
        platforms: options.platforms,
        hasNewProjectFiles,
        exp
    };
}

//# sourceMappingURL=prebuildAsync.js.map