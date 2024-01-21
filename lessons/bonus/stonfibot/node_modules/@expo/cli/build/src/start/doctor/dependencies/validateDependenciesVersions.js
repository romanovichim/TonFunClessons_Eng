"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.validateDependenciesVersionsAsync = validateDependenciesVersionsAsync;
exports.logIncorrectDependencies = logIncorrectDependencies;
exports.getVersionedDependenciesAsync = getVersionedDependenciesAsync;
var _assert = _interopRequireDefault(require("assert"));
var _chalk = _interopRequireDefault(require("chalk"));
var _semver = _interopRequireDefault(require("semver"));
var _getVersionedPackages = require("./getVersionedPackages");
var _resolvePackages = require("./resolvePackages");
var Log = _interopRequireWildcard(require("../../../log"));
var _env = require("../../../utils/env");
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
const debug = require("debug")("expo:doctor:dependencies:validate");
async function validateDependenciesVersionsAsync(projectRoot, exp, pkg, packagesToCheck) {
    if (_env.env.EXPO_OFFLINE) {
        Log.warn("Skipping dependency validation in offline mode");
        return null;
    }
    const incorrectDeps = await getVersionedDependenciesAsync(projectRoot, exp, pkg, packagesToCheck);
    return logIncorrectDependencies(incorrectDeps);
}
function logInvalidDependency({ packageName , expectedVersionOrRange , actualVersion  }) {
    Log.warn(// chalk` - {underline ${packageName}} - expected version: {underline ${expectedVersionOrRange}} - actual version installed: {underline ${actualVersion}}`
    _chalk.default`  {bold ${packageName}}{cyan @}{red ${actualVersion}} - expected version: {green ${expectedVersionOrRange}}`);
}
function logIncorrectDependencies(incorrectDeps) {
    if (!incorrectDeps.length) {
        return true;
    }
    Log.warn(_chalk.default`The following packages should be updated for best compatibility with the installed {bold expo} version:`);
    incorrectDeps.forEach((dep)=>logInvalidDependency(dep)
    );
    Log.warn("Your project may not work correctly until you install the correct versions of the packages.");
    return false;
}
async function getVersionedDependenciesAsync(projectRoot, exp, pkg, packagesToCheck) {
    var ref, ref1;
    // This should never happen under normal circumstances since
    // the CLI is versioned in the `expo` package.
    (0, _assert).default(exp.sdkVersion, "SDK Version is missing");
    // Get from both endpoints and combine the known package versions.
    const combinedKnownPackages = await (0, _getVersionedPackages).getCombinedKnownVersionsAsync({
        projectRoot,
        sdkVersion: exp.sdkVersion
    });
    // debug(`Known dependencies: %O`, combinedKnownPackages);
    const resolvedDependencies = (packagesToCheck == null ? void 0 : packagesToCheck.length) ? getFilteredObject(packagesToCheck, {
        ...pkg.dependencies,
        ...pkg.devDependencies
    }) : {
        ...pkg.dependencies,
        ...pkg.devDependencies
    };
    debug(`Checking dependencies for ${exp.sdkVersion}: %O`, resolvedDependencies);
    // intersection of packages from package.json and bundled native modules
    const { known: resolvedPackagesToCheck , unknown  } = getPackagesToCheck(resolvedDependencies, combinedKnownPackages);
    debug(`Comparing known versions: %O`, resolvedPackagesToCheck);
    debug(`Skipping packages that cannot be versioned automatically: %O`, unknown);
    // read package versions from the file system (node_modules)
    const packageVersions = await (0, _resolvePackages).resolveAllPackageVersionsAsync(projectRoot, resolvedPackagesToCheck);
    debug(`Package versions: %O`, packageVersions);
    // find incorrect dependencies by comparing the actual package versions with the bundled native module version ranges
    let incorrectDeps = findIncorrectDependencies(pkg, packageVersions, combinedKnownPackages);
    debug(`Incorrect dependencies: %O`, incorrectDeps);
    if (pkg == null ? void 0 : (ref = pkg.expo) == null ? void 0 : (ref1 = ref.install) == null ? void 0 : ref1.exclude) {
        const packagesToExclude = pkg.expo.install.exclude;
        const incorrectAndExcludedDeps = incorrectDeps.filter((dep)=>packagesToExclude.includes(dep.packageName)
        );
        debug(`Incorrect dependency warnings filtered out by expo.install.exclude: %O`, incorrectAndExcludedDeps.map((dep)=>dep.packageName
        ));
        incorrectDeps = incorrectDeps.filter((dep)=>!packagesToExclude.includes(dep.packageName)
        );
    }
    return incorrectDeps;
}
function getFilteredObject(keys, object) {
    return keys.reduce((acc, key)=>{
        acc[key] = object[key];
        return acc;
    }, {});
}
function getPackagesToCheck(dependencies, bundledNativeModules) {
    const dependencyNames = Object.keys(dependencies != null ? dependencies : {});
    const known = [];
    const unknown = [];
    for (const dependencyName of dependencyNames){
        if (dependencyName in bundledNativeModules) {
            known.push(dependencyName);
        } else {
            unknown.push(dependencyName);
        }
    }
    return {
        known,
        unknown
    };
}
function findIncorrectDependencies(pkg, packageVersions, bundledNativeModules) {
    const packages = Object.keys(packageVersions);
    const incorrectDeps = [];
    for (const packageName of packages){
        const expectedVersionOrRange = bundledNativeModules[packageName];
        const actualVersion = packageVersions[packageName];
        if (isDependencyVersionIncorrect(packageName, expectedVersionOrRange, actualVersion)) {
            incorrectDeps.push({
                packageName,
                packageType: findDependencyType(pkg, packageName),
                expectedVersionOrRange,
                actualVersion
            });
        }
    }
    return incorrectDeps;
}
function isDependencyVersionIncorrect(packageName, expectedVersionOrRange, actualVersion) {
    if (typeof expectedVersionOrRange !== "string") {
        return false;
    }
    // we never want to go backwards with the expo patch version
    if (packageName === "expo") {
        if (_semver.default.ltr(actualVersion, expectedVersionOrRange)) {
            return true;
        }
        return false;
    }
    // all other packages: version range is based on Expo SDK version, so we always want to match range
    if (!_semver.default.intersects(expectedVersionOrRange, actualVersion)) {
        return true;
    }
    return false;
}
function findDependencyType(pkg, packageName) {
    if (pkg.devDependencies && packageName in pkg.devDependencies) {
        return "devDependencies";
    }
    return "dependencies";
}

//# sourceMappingURL=validateDependenciesVersions.js.map