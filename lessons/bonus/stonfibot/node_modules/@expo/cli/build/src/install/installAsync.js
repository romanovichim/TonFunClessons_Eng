"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.installAsync = installAsync;
exports.installPackagesAsync = installPackagesAsync;
var _config = require("@expo/config");
var PackageManager = _interopRequireWildcard(require("@expo/package-manager"));
var _chalk = _interopRequireDefault(require("chalk"));
var _applyPlugins = require("./applyPlugins");
var _checkPackages = require("./checkPackages");
var _installExpoPackage = require("./installExpoPackage");
var Log = _interopRequireWildcard(require("../log"));
var _getVersionedPackages = require("../start/doctor/dependencies/getVersionedPackages");
var _errors = require("../utils/errors");
var _findUp = require("../utils/findUp");
var _link = require("../utils/link");
var _nodeEnv = require("../utils/nodeEnv");
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
async function installAsync(packages, options, packageManagerArguments = []) {
    (0, _nodeEnv).setNodeEnv("development");
    var _projectRoot;
    // Locate the project root based on the process current working directory.
    // This enables users to run `npx expo install` from a subdirectory of the project.
    const projectRoot = (_projectRoot = options.projectRoot) != null ? _projectRoot : (0, _findUp).findUpProjectRootOrAssert(process.cwd());
    require("@expo/env").load(projectRoot);
    // Resolve the package manager used by the project, or based on the provided arguments.
    const packageManager = PackageManager.createForProject(projectRoot, {
        npm: options.npm,
        yarn: options.yarn,
        bun: options.bun,
        pnpm: options.pnpm,
        silent: options.silent,
        log: Log.log
    });
    const expoVersion = findPackageByName(packages, "expo");
    const otherPackages = packages.filter((pkg)=>pkg !== expoVersion
    );
    // Abort early when installing `expo@<version>` and other packages with `--fix/--check`
    if (packageHasVersion(expoVersion) && otherPackages.length && (options.check || options.fix)) {
        throw new _errors.CommandError("BAD_ARGS", `Cannot install other packages with ${expoVersion} and --fix or --check`);
    }
    // Only check/fix packages if `expo@<version>` is not requested
    if (!packageHasVersion(expoVersion) && (options.check || options.fix)) {
        return await (0, _checkPackages).checkPackagesAsync(projectRoot, {
            packages,
            options,
            packageManager,
            packageManagerArguments
        });
    }
    // Read the project Expo config without plugins.
    const { exp  } = (0, _config).getConfig(projectRoot, {
        // Sometimes users will add a plugin to the config before installing the library,
        // this wouldn't work unless we dangerously disable plugin serialization.
        skipPlugins: true
    });
    // Resolve the versioned packages, then install them.
    return installPackagesAsync(projectRoot, {
        ...options,
        packageManager,
        packages,
        packageManagerArguments,
        sdkVersion: exp.sdkVersion
    });
}
async function installPackagesAsync(projectRoot, { packages , packageManager , sdkVersion , packageManagerArguments , fix , check  }) {
    // Read the project Expo config without plugins.
    const pkg1 = (0, _config).getPackageJson(projectRoot);
    //assertNotInstallingExcludedPackages(projectRoot, packages, pkg);
    const versioning = await (0, _getVersionedPackages).getVersionedPackagesAsync(projectRoot, {
        packages,
        // sdkVersion is always defined because we don't skipSDKVersionRequirement in getConfig.
        sdkVersion,
        pkg: pkg1
    });
    Log.log(_chalk.default`\u203A Installing ${versioning.messages.length ? versioning.messages.join(" and ") + " " : ""}using {bold ${packageManager.name}}`);
    if (versioning.excludedNativeModules.length) {
        const alreadyExcluded = versioning.excludedNativeModules.filter((module)=>module.isExcludedFromValidation
        );
        const specifiedExactVersion = versioning.excludedNativeModules.filter((module)=>!module.isExcludedFromValidation
        );
        if (alreadyExcluded.length) {
            Log.log(_chalk.default`\u203A Using ${(0, _strings).joinWithCommasAnd(alreadyExcluded.map(({ bundledNativeVersion , name , specifiedVersion  })=>`${specifiedVersion || "latest"} instead of  ${bundledNativeVersion} for ${name}`
            ))} because ${alreadyExcluded.length > 1 ? "they are" : "it is"} listed in {bold expo.install.exclude} in package.json. ${(0, _link).learnMore("https://expo.dev/more/expo-cli/#configuring-dependency-validation")}`);
        }
        if (specifiedExactVersion.length) {
            Log.log(_chalk.default`\u203A Using ${(0, _strings).joinWithCommasAnd(specifiedExactVersion.map(({ bundledNativeVersion , name , specifiedVersion  })=>`${specifiedVersion} instead of ${bundledNativeVersion} for ${name}`
            ))} because ${specifiedExactVersion.length > 1 ? "these versions" : "this version"} was explicitly provided. Packages excluded from dependency validation should be listed in {bold expo.install.exclude} in package.json. ${(0, _link).learnMore("https://expo.dev/more/expo-cli/#configuring-dependency-validation")}`);
        }
    }
    // `expo` needs to be installed before installing other packages
    const expoPackage = findPackageByName(packages, "expo");
    if (expoPackage) {
        const postInstallCommand = packages.filter((pkg)=>pkg !== expoPackage
        );
        // Pipe options to the next command
        if (fix) postInstallCommand.push("--fix");
        if (check) postInstallCommand.push("--check");
        // Abort after installing `expo`, follow up command is spawn in a new process
        return await (0, _installExpoPackage).installExpoPackageAsync(projectRoot, {
            packageManager,
            packageManagerArguments,
            expoPackageToInstall: versioning.packages.find((pkg)=>pkg.startsWith("expo@")
            ),
            followUpCommandArgs: postInstallCommand
        });
    }
    await packageManager.addAsync([
        ...packageManagerArguments,
        ...versioning.packages
    ]);
    await (0, _applyPlugins).applyPluginsAsync(projectRoot, versioning.packages);
}
/** Find a package, by name, in the requested packages list (`expo` -> `expo`/`expo@<version>`) */ function findPackageByName(packages, name) {
    return packages.find((pkg)=>pkg === name || pkg.startsWith(`${name}@`)
    );
}
/** Determine if a specific version is requested for a package */ function packageHasVersion(name = "") {
    return name.includes("@");
}

//# sourceMappingURL=installAsync.js.map