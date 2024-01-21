"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.createCopyFilesSuccessMessage = createCopyFilesSuccessMessage;
exports.copyTemplateFiles = copyTemplateFiles;
var _chalk = _interopRequireDefault(require("chalk"));
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _dir = require("../utils/dir");
var _mergeGitIgnorePaths = require("../utils/mergeGitIgnorePaths");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const debug = require("debug")("expo:prebuild:copyTemplateFiles");
/**
 * Return true if the given platforms all have an internal `.gitignore` file.
 *
 * @param projectRoot
 * @param platforms
 */ function hasAllPlatformSpecificGitIgnores(projectRoot, platforms) {
    return platforms.reduce((p, platform)=>p && _fs.default.existsSync(_path.default.join(projectRoot, platform, ".gitignore"))
    , true);
}
function createCopyFilesSuccessMessage(platforms, { skippedPaths , gitignore  }) {
    const pluralized = platforms.length > 1 ? "directories" : "directory";
    let message = `Created native ${pluralized}`;
    if (skippedPaths.length) {
        message += _chalk.default.dim(` | reusing ${skippedPaths.map((path)=>_chalk.default.bold(`/${path}`)
        ).join(", ")}`);
    }
    if (!gitignore) {
    // Add no additional message...
    } else if (!gitignore.didMerge) {
        message += _chalk.default.dim(` | reusing gitignore`);
    } else if (gitignore.didMerge && gitignore.didClear) {
        // This is legacy and for non-standard templates. The Expo template adds gitignores to the platform folders.
        message += _chalk.default.dim(` | updated gitignore`);
    }
    return message;
}
function copyTemplateFiles(projectRoot, { templateDirectory , platforms  }) {
    const copiedPaths = [];
    const skippedPaths = [];
    platforms.forEach((copyFilePath)=>{
        const projectPath = _path.default.join(projectRoot, copyFilePath);
        if (_fs.default.existsSync(projectPath)) {
            skippedPaths.push(copyFilePath);
        } else {
            copiedPaths.push(copyFilePath);
            (0, _dir).copySync(_path.default.join(templateDirectory, copyFilePath), projectPath);
        }
    });
    const hasPlatformSpecificGitIgnores = hasAllPlatformSpecificGitIgnores(templateDirectory, platforms);
    debug(`All platforms have an internal gitignore: ${hasPlatformSpecificGitIgnores}`);
    // TODO: Remove gitignore modifications -- maybe move to `npx expo-doctor`
    const gitignore = hasPlatformSpecificGitIgnores ? null : (0, _mergeGitIgnorePaths).mergeGitIgnorePaths(_path.default.join(projectRoot, ".gitignore"), _path.default.join(templateDirectory, ".gitignore"));
    return {
        copiedPaths,
        skippedPaths,
        gitignore
    };
}

//# sourceMappingURL=copyTemplateFiles.js.map