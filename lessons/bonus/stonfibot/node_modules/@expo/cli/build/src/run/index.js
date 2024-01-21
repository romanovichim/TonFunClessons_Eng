#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.expoRun = void 0;
var _chalk = _interopRequireDefault(require("chalk"));
var _hints = require("./hints");
var _args = require("../utils/args");
var _errors = require("../utils/errors");
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
const expoRun = async (argv)=>{
    const args = (0, _args).assertWithOptionsArgs({
        // Types
        "--help": Boolean,
        // Aliases
        "-h": "--help"
    }, {
        argv,
        // Allow additional flags for both android and ios commands
        permissive: true
    });
    try {
        var __;
        let [platform] = (__ = args._) != null ? __ : [];
        // Workaround, filter `--flag` as platform
        if (platform == null ? void 0 : platform.startsWith("-")) {
            platform = "";
        }
        // Remove the platform from raw arguments, when provided
        const argsWithoutPlatform = !platform ? argv : argv == null ? void 0 : argv.splice(1);
        // Do not capture `--help` when platform is provided
        if (!platform && args["--help"]) {
            (0, _args).printHelp("Run the native app locally", `npx expo run <android|ios>`, _chalk.default`{dim $} npx expo run <android|ios> --help  Output usage information`);
        }
        if (!platform) {
            const { selectAsync  } = await Promise.resolve().then(function() {
                return _interopRequireWildcard(require("../utils/prompts.js"));
            });
            platform = await selectAsync("Select the platform to run", [
                {
                    title: "Android",
                    value: "android"
                },
                {
                    title: "iOS",
                    value: "ios"
                }, 
            ]);
        }
        (0, _hints).logPlatformRunCommand(platform, argsWithoutPlatform);
        switch(platform){
            case "android":
                {
                    const { expoRunAndroid  } = await Promise.resolve().then(function() {
                        return _interopRequireWildcard(require("./android/index.js"));
                    });
                    return expoRunAndroid(argsWithoutPlatform);
                }
            case "ios":
                {
                    const { expoRunIos  } = await Promise.resolve().then(function() {
                        return _interopRequireWildcard(require("./ios/index.js"));
                    });
                    return expoRunIos(argsWithoutPlatform);
                }
            default:
                throw new _errors.CommandError("UNSUPPORTED_PLATFORM", `Unsupported platform: ${platform}`);
        }
    } catch (error) {
        (0, _errors).logCmdError(error);
    }
};
exports.expoRun = expoRun;

//# sourceMappingURL=index.js.map