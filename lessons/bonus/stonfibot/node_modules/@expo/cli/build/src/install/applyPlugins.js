"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.applyPluginsAsync = applyPluginsAsync;
var _config = require("@expo/config");
var Log = _interopRequireWildcard(require("../log"));
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
async function applyPluginsAsync(projectRoot, packages) {
    const { autoAddConfigPluginsAsync  } = await Promise.resolve().then(function() {
        return _interopRequireWildcard(require("./utils/autoAddConfigPlugins.js"));
    });
    try {
        const { exp  } = (0, _config).getConfig(projectRoot, {
            skipSDKVersionRequirement: true
        });
        // Only auto add plugins if the plugins array is defined or if the project is using SDK +42.
        await autoAddConfigPluginsAsync(projectRoot, exp, // Split any possible NPM tags. i.e. `expo@latest` -> `expo`
        packages.map((pkg)=>pkg.split("@")[0]
        ).filter(Boolean));
    } catch (error) {
        // If we fail to apply plugins, the log a warning and continue.
        if (error.isPluginError) {
            Log.warn(`Skipping config plugin check: ` + error.message);
            return;
        }
        // Any other error, rethrow.
        throw error;
    }
}

//# sourceMappingURL=applyPlugins.js.map