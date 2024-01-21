"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.checkPackagesAsync = checkPackagesAsync;
var _config = require("@expo/config");
var _chalk = _interopRequireDefault(require("chalk"));
var _fixPackages = require("./fixPackages");
var Log = _interopRequireWildcard(require("../log"));
var _validateDependenciesVersions = require("../start/doctor/dependencies/validateDependenciesVersions");
var _interactive = require("../utils/interactive");
var _link = require("../utils/link");
var _prompts = require("../utils/prompts");
var _strings = require("../utils/strings");
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
const debug = require("debug")("expo:install:check");
async function checkPackagesAsync(projectRoot, { packages , packageManager , options: { fix  } , packageManagerArguments  }) {
    var ref, ref1, ref2;
    // Read the project Expo config without plugins.
    const { exp , pkg  } = (0, _config).getConfig(projectRoot, {
        // Sometimes users will add a plugin to the config before installing the library,
        // this wouldn't work unless we dangerously disable plugin serialization.
        skipPlugins: true
    });
    if ((ref = pkg.expo) == null ? void 0 : (ref1 = ref.install) == null ? void 0 : (ref2 = ref1.exclude) == null ? void 0 : ref2.length) {
        Log.log(_chalk.default`Skipped ${fix ? "fixing" : "checking"} dependencies: ${(0, _strings).joinWithCommasAnd(pkg.expo.install.exclude)}. These dependencies are listed in {bold expo.install.exclude} in package.json. ${(0, _link).learnMore("https://expo.dev/more/expo-cli/#configuring-dependency-validation")}`);
    }
    const dependencies = await (0, _validateDependenciesVersions).getVersionedDependenciesAsync(projectRoot, exp, pkg, packages);
    if (!dependencies.length) {
        Log.exit(_chalk.default.greenBright("Dependencies are up to date"), 0);
    }
    (0, _validateDependenciesVersions).logIncorrectDependencies(dependencies);
    const value = // If `--fix` then always fix.
    fix || // Otherwise prompt to fix when not running in CI.
    ((0, _interactive).isInteractive() && await (0, _prompts).confirmAsync({
        message: "Fix dependencies?"
    }).catch(()=>false
    ));
    if (value) {
        debug("Installing fixed dependencies:", dependencies);
        // Install the corrected dependencies.
        return (0, _fixPackages).fixPackagesAsync(projectRoot, {
            packageManager,
            packages: dependencies,
            packageManagerArguments,
            sdkVersion: exp.sdkVersion
        });
    }
    // Exit with non-zero exit code if any of the dependencies are out of date.
    Log.exit(_chalk.default.red("Found outdated dependencies"), 1);
}

//# sourceMappingURL=checkPackages.js.map