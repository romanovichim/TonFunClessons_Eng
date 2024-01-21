"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.typescript = typescript;
var _config = require("@expo/config");
var _log = require("../log");
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
async function typescript(projectRoot) {
    const { TypeScriptProjectPrerequisite  } = await Promise.resolve().then(function() {
        return _interopRequireWildcard(require("../start/doctor/typescript/TypeScriptProjectPrerequisite.js"));
    });
    const { MetroBundlerDevServer  } = await Promise.resolve().then(function() {
        return _interopRequireWildcard(require("../start/server/metro/MetroBundlerDevServer.js"));
    });
    const { getPlatformBundlers  } = await Promise.resolve().then(function() {
        return _interopRequireWildcard(require("../start/server/platformBundlers.js"));
    });
    try {
        await new TypeScriptProjectPrerequisite(projectRoot).bootstrapAsync();
    } catch (error) {
        // Ensure the process doesn't fail if the TypeScript check fails.
        // This could happen during the install.
        _log.Log.log();
        _log.Log.exception(error);
        return;
    }
    const { exp  } = (0, _config).getConfig(projectRoot, {
        skipSDKVersionRequirement: true
    });
    await new MetroBundlerDevServer(projectRoot, getPlatformBundlers(projectRoot, exp), {
        isDevClient: true
    }).startTypeScriptServices();
}

//# sourceMappingURL=typescript.js.map