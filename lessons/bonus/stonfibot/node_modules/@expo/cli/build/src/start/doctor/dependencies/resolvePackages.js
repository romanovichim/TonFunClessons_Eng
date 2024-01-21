"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.resolvePackageVersionAsync = resolvePackageVersionAsync;
exports.resolveAllPackageVersionsAsync = resolveAllPackageVersionsAsync;
exports.hasExpoCanaryAsync = hasExpoCanaryAsync;
var _jsonFile = _interopRequireDefault(require("@expo/json-file"));
var _resolveFrom = _interopRequireDefault(require("resolve-from"));
var _semver = _interopRequireDefault(require("semver"));
var _errors = require("../../../utils/errors");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function resolvePackageVersionAsync(projectRoot, packageName) {
    let packageJsonPath;
    try {
        packageJsonPath = (0, _resolveFrom).default(projectRoot, `${packageName}/package.json`);
    } catch (error) {
        // This is a workaround for packages using `exports`. If this doesn't
        // include `package.json`, we have to use the error message to get the location.
        if (error.code === "ERR_PACKAGE_PATH_NOT_EXPORTED") {
            var ref;
            packageJsonPath = (ref = error.message.match(/("exports"|defined) in (.*)$/i)) == null ? void 0 : ref[2];
        }
    }
    if (!packageJsonPath) {
        throw new _errors.CommandError("PACKAGE_NOT_FOUND", `"${packageName}" is added as a dependency in your project's package.json but it doesn't seem to be installed. Please run "yarn" or "npm install" to fix this issue.`);
    }
    const packageJson = await _jsonFile.default.readAsync(packageJsonPath);
    return packageJson.version;
}
async function resolveAllPackageVersionsAsync(projectRoot, packages) {
    const resolvedPackages = await Promise.all(packages.map(async (packageName)=>[
            packageName,
            await resolvePackageVersionAsync(projectRoot, packageName), 
        ]
    ));
    return Object.fromEntries(resolvedPackages);
}
async function hasExpoCanaryAsync(projectRoot) {
    let expoVersion = "";
    try {
        // Resolve installed `expo` version first
        expoVersion = await resolvePackageVersionAsync(projectRoot, "expo");
    } catch (error) {
        var ref;
        if (error.code !== "PACKAGE_NOT_FOUND") {
            throw error;
        }
        // Resolve through project `package.json`
        const packageJson = await _jsonFile.default.readAsync((0, _resolveFrom).default(projectRoot, "./package.json"));
        var ref1;
        expoVersion = (ref1 = (ref = packageJson.dependencies) == null ? void 0 : ref.expo) != null ? ref1 : "";
    }
    if (expoVersion === "canary") {
        return true;
    }
    const prerelease = _semver.default.prerelease(expoVersion) || [];
    return !!prerelease.some((segment)=>typeof segment === "string" && segment.includes("canary")
    );
}

//# sourceMappingURL=resolvePackages.js.map