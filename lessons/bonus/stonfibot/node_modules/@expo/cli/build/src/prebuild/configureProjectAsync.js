"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.configureProjectAsync = configureProjectAsync;
var _configPlugins = require("@expo/config-plugins");
var _prebuildConfig = require("@expo/prebuild-config");
var _configAsync = require("../config/configAsync");
var Log = _interopRequireWildcard(require("../log"));
var _env = require("../utils/env");
var _getOrPromptApplicationId = require("../utils/getOrPromptApplicationId");
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
async function configureProjectAsync(projectRoot, { platforms , exp , templateChecksum  }) {
    let bundleIdentifier;
    if (platforms.includes("ios")) {
        // Check bundle ID before reading the config because it may mutate the config if the user is prompted to define it.
        bundleIdentifier = await (0, _getOrPromptApplicationId).getOrPromptForBundleIdentifier(projectRoot, exp);
    }
    let packageName;
    if (platforms.includes("android")) {
        // Check package before reading the config because it may mutate the config if the user is prompted to define it.
        packageName = await (0, _getOrPromptApplicationId).getOrPromptForPackage(projectRoot, exp);
    }
    let { exp: config  } = await (0, _prebuildConfig).getPrebuildConfigAsync(projectRoot, {
        platforms,
        packageName,
        bundleIdentifier
    });
    if (templateChecksum) {
        var __internal;
        // Prepare template checksum for the patch mods
        config._internal = (__internal = config._internal) != null ? __internal : {};
        config._internal.templateChecksum = templateChecksum;
    }
    // compile all plugins and mods
    config = await (0, _configPlugins).compileModsAsync(config, {
        projectRoot,
        platforms,
        assertMissingModProviders: false
    });
    if (_env.env.EXPO_DEBUG) {
        Log.log();
        Log.log("Evaluated config:");
        (0, _configAsync).logConfig(config);
        Log.log();
    }
    return config;
}

//# sourceMappingURL=configureProjectAsync.js.map