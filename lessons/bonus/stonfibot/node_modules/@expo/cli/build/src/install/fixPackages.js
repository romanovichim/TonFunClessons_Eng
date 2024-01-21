"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.fixPackagesAsync = fixPackagesAsync;
var _chalk = _interopRequireDefault(require("chalk"));
var _applyPlugins = require("./applyPlugins");
var _installExpoPackage = require("./installExpoPackage");
var Log = _interopRequireWildcard(require("../log"));
var _getVersionedPackages = require("../start/doctor/dependencies/getVersionedPackages");
var _array = require("../utils/array");
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
async function fixPackagesAsync(projectRoot, { packages , packageManager , sdkVersion , packageManagerArguments  }) {
    if (!packages.length) {
        return;
    }
    const { dependencies =[] , devDependencies =[]  } = (0, _array).groupBy(packages, (dep)=>dep.packageType
    );
    const versioningMessages = (0, _getVersionedPackages).getOperationLog({
        othersCount: 0,
        nativeModulesCount: packages.length,
        sdkVersion
    });
    // display all packages to update, including expo package
    Log.log(_chalk.default`\u203A Installing ${versioningMessages.length ? versioningMessages.join(" and ") + " " : ""}using {bold ${packageManager.name}}`);
    // if updating expo package, install this first, then run expo install --fix again under new version
    const expoDep = dependencies.find((dep)=>dep.packageName === "expo"
    );
    if (expoDep) {
        await (0, _installExpoPackage).installExpoPackageAsync(projectRoot, {
            packageManager,
            packageManagerArguments,
            expoPackageToInstall: `expo@${expoDep.expectedVersionOrRange}`,
            followUpCommandArgs: [
                "--fix"
            ]
        });
        // follow-up commands will be spawned in a detached process, so return immediately
        return;
    }
    if (dependencies.length) {
        const versionedPackages = dependencies.map((dep)=>`${dep.packageName}@${dep.expectedVersionOrRange}`
        );
        await packageManager.addAsync([
            ...packageManagerArguments,
            ...versionedPackages
        ]);
        await (0, _applyPlugins).applyPluginsAsync(projectRoot, versionedPackages);
    }
    if (devDependencies.length) {
        await packageManager.addDevAsync([
            ...packageManagerArguments,
            ...devDependencies.map((dep)=>`${dep.packageName}@${dep.expectedVersionOrRange}`
            ), 
        ]);
    }
}

//# sourceMappingURL=fixPackages.js.map