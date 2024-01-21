"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _os() {
  const data = _interopRequireDefault(require("os"));
  _os = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _fsExtra() {
  const data = _interopRequireDefault(require("fs-extra"));
  _fsExtra = function () {
    return data;
  };
  return data;
}
var _validate = require("./validate");
function _chalk() {
  const data = _interopRequireDefault(require("chalk"));
  _chalk = function () {
    return data;
  };
  return data;
}
var _DirectoryAlreadyExistsError = _interopRequireDefault(require("./errors/DirectoryAlreadyExistsError"));
var _printRunInstructions = _interopRequireDefault(require("./printRunInstructions"));
function _cliTools() {
  const data = require("@react-native-community/cli-tools");
  _cliTools = function () {
    return data;
  };
  return data;
}
function _cliPlatformIos() {
  const data = require("@react-native-community/cli-platform-ios");
  _cliPlatformIos = function () {
    return data;
  };
  return data;
}
var _template = require("./template");
var _editTemplate = require("./editTemplate");
var PackageManager = _interopRequireWildcard(require("../../tools/packageManager"));
var _banner = _interopRequireDefault(require("./banner"));
var _TemplateAndVersionError = _interopRequireDefault(require("./errors/TemplateAndVersionError"));
var _bun = require("../../tools/bun");
var _npm = require("../../tools/npm");
var _yarn = require("../../tools/yarn");
function _crypto() {
  const data = require("crypto");
  _crypto = function () {
    return data;
  };
  return data;
}
var _createGitRepository = _interopRequireDefault(require("./createGitRepository"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const DEFAULT_VERSION = 'latest';
function doesDirectoryExist(dir) {
  return _fsExtra().default.existsSync(dir);
}
async function setProjectDirectory(directory) {
  if (doesDirectoryExist(directory)) {
    throw new _DirectoryAlreadyExistsError.default(directory);
  }
  try {
    _fsExtra().default.mkdirSync(directory, {
      recursive: true
    });
    process.chdir(directory);
  } catch (error) {
    throw new (_cliTools().CLIError)('Error occurred while trying to create project directory.', error);
  }
  return process.cwd();
}
function getTemplateName(cwd) {
  // We use package manager to infer the name of the template module for us.
  // That's why we get it from temporary package.json, where the name is the
  // first and only dependency (hence 0).
  const name = Object.keys(JSON.parse(_fsExtra().default.readFileSync(_path().default.join(cwd, './package.json'), 'utf8')).dependencies)[0];
  return name;
}

//set cache to empty string to prevent installing cocoapods on freshly created project
function setEmptyHashForCachedDependencies(projectName) {
  _cliTools().cacheManager.set(projectName, 'dependencies', (0, _crypto().createHash)('md5').update('').digest('hex'));
}
async function createFromTemplate({
  projectName,
  templateUri,
  npm,
  pm,
  directory,
  projectTitle,
  skipInstall,
  packageName,
  installCocoaPods
}) {
  _cliTools().logger.debug('Initializing new project');
  // Only print out the banner if we're not in a CI
  if (!process.env.CI) {
    _cliTools().logger.log(_banner.default);
  }
  let didInstallPods = String(installCocoaPods) === 'true';
  let packageManager = pm;
  if (pm) {
    packageManager = pm;
  } else {
    const userAgentPM = userAgentPackageManager();
    // if possible, use the package manager from the user agent. Otherwise fallback to default (yarn)
    packageManager = userAgentPM || 'yarn';
  }
  if (npm) {
    _cliTools().logger.warn('Flag --npm is deprecated and will be removed soon. In the future, please use --pm npm instead.');
    packageManager = 'npm';
  }

  // if the project with the name already has cache, remove the cache to avoid problems with pods installation
  _cliTools().cacheManager.removeProjectCache(projectName);
  const projectDirectory = await setProjectDirectory(directory);
  const loader = (0, _cliTools().getLoader)({
    text: 'Downloading template'
  });
  const templateSourceDir = _fsExtra().default.mkdtempSync(_path().default.join(_os().default.tmpdir(), 'rncli-init-template-'));
  try {
    loader.start();
    await (0, _template.installTemplatePackage)(templateUri, templateSourceDir, packageManager);
    loader.succeed();
    loader.start('Copying template');
    const templateName = getTemplateName(templateSourceDir);
    const templateConfig = (0, _template.getTemplateConfig)(templateName, templateSourceDir);
    await (0, _template.copyTemplate)(templateName, templateConfig.templateDir, templateSourceDir);
    loader.succeed();
    loader.start('Processing template');
    await (0, _editTemplate.changePlaceholderInTemplate)({
      projectName,
      projectTitle,
      placeholderName: templateConfig.placeholderName,
      placeholderTitle: templateConfig.titlePlaceholder,
      packageName
    });
    const {
      postInitScript
    } = templateConfig;
    if (postInitScript) {
      loader.info('Executing post init script ');
      await (0, _template.executePostInitScript)(templateName, postInitScript, templateSourceDir);
    }
    if (!skipInstall) {
      await installDependencies({
        packageManager,
        loader,
        root: projectDirectory
      });
      if (process.platform === 'darwin') {
        const installPodsValue = String(installCocoaPods);
        if (installPodsValue === 'true') {
          didInstallPods = true;
          await (0, _cliPlatformIos().installPods)(loader);
          loader.succeed();
          setEmptyHashForCachedDependencies(projectName);
        } else if (installPodsValue === 'undefined') {
          const {
            installCocoapods
          } = await (0, _cliTools().prompt)({
            type: 'confirm',
            name: 'installCocoapods',
            message: `Do you want to install CocoaPods now? ${_chalk().default.reset.dim('Only needed if you run your project in Xcode directly')}`
          });
          didInstallPods = installCocoapods;
          if (installCocoapods) {
            await (0, _cliPlatformIos().installPods)(loader);
            loader.succeed();
            setEmptyHashForCachedDependencies(projectName);
          }
        }
      }
    } else {
      didInstallPods = false;
      loader.succeed('Dependencies installation skipped');
    }
  } catch (e) {
    if (e instanceof Error) {
      _cliTools().logger.error('Installing pods failed. This doesn\'t affect project initialization and you can safely proceed. \nHowever, you will need to install pods manually when running iOS, follow additional steps in "Run instructions for iOS" section.\n');
    }
    loader.fail();
    didInstallPods = false;
  } finally {
    _fsExtra().default.removeSync(templateSourceDir);
  }
  if (process.platform === 'darwin') {
    _cliTools().logger.log('\n');
    _cliTools().logger.info(`💡 To enable automatic CocoaPods installation when building for iOS you can create react-native.config.js with automaticPodsInstallation field. \n${_chalk().default.reset.dim(`For more details, see ${_chalk().default.underline('https://github.com/react-native-community/cli/blob/main/docs/projects.md#projectiosautomaticpodsinstallation')}`)}
            `);
  }
  return {
    didInstallPods
  };
}
async function installDependencies({
  packageManager,
  loader,
  root
}) {
  loader.start('Installing dependencies');
  await PackageManager.installAll({
    packageManager,
    silent: true,
    root
  });
  loader.succeed();
}
function checkPackageManagerAvailability(packageManager) {
  if (packageManager === 'bun') {
    return (0, _bun.getBunVersionIfAvailable)();
  } else if (packageManager === 'npm') {
    return (0, _npm.getNpmVersionIfAvailable)();
  } else if (packageManager === 'yarn') {
    return (0, _yarn.getYarnVersionIfAvailable)();
  }
  return false;
}
function createTemplateUri(options, version) {
  const isTypescriptTemplate = options.template === 'react-native-template-typescript';

  // This allows to correctly retrieve template uri for out of tree platforms.
  const platform = options.platformName || 'react-native';
  if (isTypescriptTemplate) {
    _cliTools().logger.warn("Ignoring custom template: 'react-native-template-typescript'. Starting from React Native v0.71 TypeScript is used by default.");
    return platform;
  }
  return options.template || `${platform}@${version}`;
}
async function createProject(projectName, directory, version, options) {
  const templateUri = createTemplateUri(options, version);
  return createFromTemplate({
    projectName,
    templateUri,
    npm: options.npm,
    pm: options.pm,
    directory,
    projectTitle: options.title,
    skipInstall: options.skipInstall,
    packageName: options.packageName,
    installCocoaPods: options.installPods,
    version
  });
}
function userAgentPackageManager() {
  const userAgent = process.env.npm_config_user_agent;
  if (userAgent) {
    if (userAgent.startsWith('yarn')) {
      return 'yarn';
    }
    if (userAgent.startsWith('npm')) {
      return 'npm';
    }
    if (userAgent.startsWith('bun')) {
      return 'bun';
    }
  }
  return null;
}
var initialize = async function initialize([projectName], options) {
  if (!projectName) {
    const {
      projName
    } = await (0, _cliTools().prompt)({
      type: 'text',
      name: 'projName',
      message: 'How would you like to name the app?'
    });
    projectName = projName;
  }
  (0, _validate.validateProjectName)(projectName);
  if (!!options.template && !!options.version) {
    throw new _TemplateAndVersionError.default(options.template);
  }
  const root = process.cwd();
  const version = options.version || DEFAULT_VERSION;
  const directoryName = _path().default.relative(root, options.directory || projectName);
  if (options.pm && !checkPackageManagerAvailability(options.pm)) {
    _cliTools().logger.error('Seems like the package manager you want to use is not installed. Please install it or choose another package manager.');
    return;
  }
  const {
    didInstallPods
  } = await createProject(projectName, directoryName, version, options);
  const projectFolder = _path().default.join(root, directoryName);
  if (!options.skipGitInit) {
    await (0, _createGitRepository.default)(projectFolder);
  }
  (0, _printRunInstructions.default)(projectFolder, projectName, {
    showPodsInstructions: !didInstallPods
  });
};
exports.default = initialize;

//# sourceMappingURL=init.ts.map