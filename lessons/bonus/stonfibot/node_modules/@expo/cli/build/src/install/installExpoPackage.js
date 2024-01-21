"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.installExpoPackageAsync = installExpoPackageAsync;
var _spawnAsync = _interopRequireDefault(require("@expo/spawn-async"));
var _chalk = _interopRequireDefault(require("chalk"));
var Log = _interopRequireWildcard(require("../log"));
var _getRunningProcess = require("../utils/getRunningProcess");
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
async function installExpoPackageAsync(projectRoot, { packageManager , packageManagerArguments , expoPackageToInstall , followUpCommandArgs  }) {
    // Check if there's potentially a dev server running in the current folder and warn about it
    // (not guaranteed to be Expo CLI, and the CLI isn't always running on 8081, but it's a good guess)
    const isExpoMaybeRunningForProject = !!await (0, _getRunningProcess).getRunningProcess(8081);
    if (isExpoMaybeRunningForProject) {
        Log.warn("The Expo CLI appears to be running this project in another terminal window. Close and restart any Expo CLI instances after the installation to complete the update.");
    }
    // Safe to use current process to upgrade Expo package- doesn't affect current process
    try {
        await packageManager.addAsync([
            ...packageManagerArguments,
            expoPackageToInstall
        ]);
    } catch (error) {
        Log.error(_chalk.default`Cannot install the latest Expo package. Install {bold expo@latest} with ${packageManager.name} and then run {bold npx expo install} again.`);
        throw error;
    }
    Log.log(_chalk.default`\u203A Running {bold npx expo install} under the updated expo version`);
    let commandSegments = [
        "expo",
        "install",
        ...followUpCommandArgs
    ];
    if (packageManagerArguments.length) {
        commandSegments = [
            ...commandSegments,
            "--",
            ...packageManagerArguments
        ];
    }
    Log.log("> " + commandSegments.join(" "));
    // Spawn a new process to install the rest of the packages, as only then will the latest Expo package be used
    if (followUpCommandArgs.length) {
        await (0, _spawnAsync).default("npx", commandSegments, {
            stdio: "inherit",
            cwd: projectRoot,
            env: {
                ...process.env
            }
        });
    }
}

//# sourceMappingURL=installExpoPackage.js.map