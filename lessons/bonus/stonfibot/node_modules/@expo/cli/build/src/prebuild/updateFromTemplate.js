"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.updateFromTemplateAsync = updateFromTemplateAsync;
exports.cloneTemplateAndCopyToProjectAsync = cloneTemplateAndCopyToProjectAsync;
var _chalk = _interopRequireDefault(require("chalk"));
var _copyTemplateFiles = require("./copyTemplateFiles");
var _resolveTemplate = require("./resolveTemplate");
var _updatePackageJson = require("./updatePackageJson");
var _validateTemplatePlatforms = require("./validateTemplatePlatforms");
var Log = _interopRequireWildcard(require("../log"));
var _errors = require("../utils/errors");
var _ora = require("../utils/ora");
var _profile = require("../utils/profile");
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
async function updateFromTemplateAsync(projectRoot, { exp , pkg , template , templateDirectory , platforms , skipDependencyUpdate  }) {
    if (!templateDirectory) {
        const temporary = await Promise.resolve().then(function() {
            return _interopRequireWildcard(require("tempy"));
        });
        templateDirectory = temporary.directory();
    }
    const { copiedPaths , templateChecksum  } = await (0, _profile).profile(cloneTemplateAndCopyToProjectAsync)({
        projectRoot,
        template,
        templateDirectory,
        exp,
        platforms
    });
    const depsResults = await (0, _profile).profile(_updatePackageJson.updatePackageJSONAsync)(projectRoot, {
        templateDirectory,
        pkg,
        skipDependencyUpdate
    });
    return {
        hasNewProjectFiles: !!copiedPaths.length,
        // If the iOS folder changes or new packages are added, we should rerun pod install.
        needsPodInstall: copiedPaths.includes("ios") || !!depsResults.changedDependencies.length,
        templateChecksum,
        ...depsResults
    };
}
async function cloneTemplateAndCopyToProjectAsync({ projectRoot , templateDirectory , template , exp , platforms: unknownPlatforms  }) {
    const platformDirectories = unknownPlatforms.map((platform)=>`./${platform}`
    ).reverse().join(" and ");
    const pluralized = unknownPlatforms.length > 1 ? "directories" : "directory";
    const ora = (0, _ora).logNewSection(`Creating native ${pluralized} (${platformDirectories})`);
    try {
        const templateChecksum = await (0, _resolveTemplate).cloneTemplateAsync({
            templateDirectory,
            template,
            exp,
            ora
        });
        const platforms = (0, _validateTemplatePlatforms).validateTemplatePlatforms({
            templateDirectory,
            platforms: unknownPlatforms
        });
        const results = (0, _copyTemplateFiles).copyTemplateFiles(projectRoot, {
            templateDirectory,
            platforms
        });
        ora.succeed((0, _copyTemplateFiles).createCopyFilesSuccessMessage(platforms, results));
        return {
            copiedPaths: results.copiedPaths,
            templateChecksum
        };
    } catch (e) {
        if (!(e instanceof _errors.AbortCommandError)) {
            Log.error(e.message);
        }
        ora.fail(`Failed to create the native ${pluralized}`);
        Log.log(_chalk.default.yellow(_chalk.default`You may want to delete the {bold ./ios} and/or {bold ./android} directories before trying again.`));
        throw new _errors.SilentError(e);
    }
}

//# sourceMappingURL=updateFromTemplate.js.map