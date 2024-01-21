"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.changePlaceholderInTemplate = changePlaceholderInTemplate;
exports.replaceNameInUTF8File = replaceNameInUTF8File;
exports.replacePlaceholderWithPackageName = replacePlaceholderWithPackageName;
exports.validatePackageName = validatePackageName;
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _cliTools() {
  const data = require("@react-native-community/cli-tools");
  _cliTools = function () {
    return data;
  };
  return data;
}
var _walk = _interopRequireDefault(require("../../tools/walk"));
function _fsExtra() {
  const data = _interopRequireDefault(require("fs-extra"));
  _fsExtra = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// We need `graceful-fs` behavior around async file renames on Win32.
// `gracefulify` does not support patching `fs.promises`. Use `fs-extra`, which
// exposes its own promise-based interface over `graceful-fs`.
/**
  TODO: This is a default placeholder for title in react-native template.
  We should get rid of this once custom templates adapt `placeholderTitle` in their configurations.
*/
const DEFAULT_TITLE_PLACEHOLDER = 'Hello App Display Name';
function validatePackageName(packageName) {
  const packageNameParts = packageName.split('.');
  const packageNameRegex = /^([a-zA-Z]([a-zA-Z0-9_])*\.)+[a-zA-Z]([a-zA-Z0-9_])*$/u;
  if (packageNameParts.length < 2) {
    throw `The package name ${packageName} is invalid. It should contain at least two segments, e.g. com.app`;
  }
  if (!packageNameRegex.test(packageName)) {
    throw `The ${packageName} package name is not valid. It can contain only alphanumeric characters and dots.`;
  }
}
async function replaceNameInUTF8File(filePath, projectName, templateName) {
  _cliTools().logger.debug(`Replacing in ${filePath}`);
  const fileContent = await _fsExtra().default.readFile(filePath, 'utf8');
  const replacedFileContent = fileContent.replace(new RegExp(templateName, 'g'), projectName).replace(new RegExp(templateName.toLowerCase(), 'g'), projectName.toLowerCase());
  if (fileContent !== replacedFileContent) {
    await _fsExtra().default.writeFile(filePath, replacedFileContent, 'utf8');
  }
}
async function renameFile(filePath, oldName, newName) {
  const newFileName = _path().default.join(_path().default.dirname(filePath), _path().default.basename(filePath).replace(new RegExp(oldName, 'g'), newName));
  _cliTools().logger.debug(`Renaming ${filePath} -> file:${newFileName}`);
  await _fsExtra().default.rename(filePath, newFileName);
}
function shouldRenameFile(filePath, nameToReplace) {
  return _path().default.basename(filePath).includes(nameToReplace);
}
function shouldIgnoreFile(filePath) {
  return filePath.match(/node_modules|yarn.lock|package-lock.json/g);
}
function isIosFile(filePath) {
  return filePath.includes('ios');
}
const UNDERSCORED_DOTFILES = ['buckconfig', 'eslintrc.js', 'flowconfig', 'gitattributes', 'gitignore', 'prettierrc.js', 'watchmanconfig', 'editorconfig', 'bundle', 'ruby-version', 'node-version', 'xcode.env'];
async function processDotfiles(filePath) {
  const dotfile = UNDERSCORED_DOTFILES.find(e => filePath.includes(`_${e}`));
  if (dotfile === undefined) {
    return;
  }
  await renameFile(filePath, `_${dotfile}`, `.${dotfile}`);
}
async function createAndroidPackagePaths(filePath, packageName) {
  const pathParts = filePath.split('/').slice(-2);
  if (pathParts[0] === 'java' && pathParts[1] === 'com') {
    const pathToFolders = filePath.split('/').slice(0, -2).join('/');
    const segmentsList = packageName.split('.');
    if (segmentsList.length > 1) {
      const initialDir = process.cwd();
      process.chdir(filePath.split('/').slice(0, -1).join('/'));
      try {
        await _fsExtra().default.rename(`${filePath}/${segmentsList.join('.')}`, `${pathToFolders}/${segmentsList[segmentsList.length - 1]}`);
        await _fsExtra().default.rmdir(filePath);
        for (const segment of segmentsList) {
          _fsExtra().default.mkdirSync(segment);
          process.chdir(segment);
        }
        await _fsExtra().default.rename(`${pathToFolders}/${segmentsList[segmentsList.length - 1]}`, process.cwd());
      } catch {
        throw 'Failed to create correct paths for Android.';
      }
      process.chdir(initialDir);
    }
  }
}
async function replacePlaceholderWithPackageName({
  projectName,
  placeholderName,
  placeholderTitle,
  packageName
}) {
  validatePackageName(packageName);
  const cleanPackageName = packageName.replace(/[^\p{L}\p{N}.]+/gu, '');
  for (const filePath of (0, _walk.default)(process.cwd()).reverse()) {
    if (shouldIgnoreFile(filePath)) {
      continue;
    }
    const iosFile = isIosFile(filePath);
    if (!(await _fsExtra().default.stat(filePath)).isDirectory()) {
      let newName = iosFile ? projectName : cleanPackageName;

      //replace bundleID for iOS
      await replaceNameInUTF8File(filePath, `PRODUCT_BUNDLE_IDENTIFIER = "${cleanPackageName}"`, 'PRODUCT_BUNDLE_IDENTIFIER = "(.*)"');
      if (filePath.includes('app.json')) {
        await replaceNameInUTF8File(filePath, projectName, placeholderName);
      } else {
        // replace main component name for Android package
        await replaceNameInUTF8File(filePath, `return "${projectName}"`, `return "${placeholderName}"`);
        await replaceNameInUTF8File(filePath, `<string name="app_name">${projectName}</string>`, `<string name="app_name">${placeholderTitle}</string>`);
        await replaceNameInUTF8File(filePath, newName, `com.${placeholderName}`);
        await replaceNameInUTF8File(filePath, newName, placeholderName);
        await replaceNameInUTF8File(filePath, newName, placeholderTitle);
      }
    }
    let fileName = cleanPackageName;
    if (shouldRenameFile(filePath, placeholderName)) {
      if (iosFile) {
        fileName = projectName;
      }
      await renameFile(filePath, placeholderName, fileName);
    } else if (shouldRenameFile(filePath, placeholderName.toLowerCase())) {
      await renameFile(filePath, placeholderName.toLowerCase(), fileName.toLowerCase());
    }
    try {
      await createAndroidPackagePaths(filePath, cleanPackageName);
    } catch (error) {
      throw new (_cliTools().CLIError)('Failed to create correct paths for Android.');
    }
    await processDotfiles(filePath);
  }
}
async function changePlaceholderInTemplate({
  projectName,
  placeholderName,
  placeholderTitle = DEFAULT_TITLE_PLACEHOLDER,
  projectTitle = projectName,
  packageName
}) {
  _cliTools().logger.debug(`Changing ${placeholderName} for ${projectName} in template`);
  if (packageName) {
    try {
      await replacePlaceholderWithPackageName({
        projectName,
        placeholderName,
        placeholderTitle,
        packageName
      });
    } catch (error) {
      throw new (_cliTools().CLIError)(error.message);
    }
  } else {
    for (const filePath of (0, _walk.default)(process.cwd()).reverse()) {
      if (shouldIgnoreFile(filePath)) {
        continue;
      }
      if (!(await _fsExtra().default.stat(filePath)).isDirectory()) {
        await replaceNameInUTF8File(filePath, projectName, placeholderName);
        await replaceNameInUTF8File(filePath, projectTitle, placeholderTitle);
      }
      if (shouldRenameFile(filePath, placeholderName)) {
        await renameFile(filePath, placeholderName, projectName);
      } else if (shouldRenameFile(filePath, placeholderName.toLowerCase())) {
        await renameFile(filePath, placeholderName.toLowerCase(), projectName.toLowerCase());
      }
      await processDotfiles(filePath);
    }
  }
}

//# sourceMappingURL=editTemplate.ts.map