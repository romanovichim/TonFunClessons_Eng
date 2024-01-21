"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.executeCommand = executeCommand;
exports.init = init;
exports.install = install;
exports.installAll = installAll;
exports.installDev = installDev;
exports.shouldUseBun = shouldUseBun;
exports.shouldUseNpm = shouldUseNpm;
exports.shouldUseYarn = shouldUseYarn;
exports.uninstall = uninstall;
function _execa() {
  const data = _interopRequireDefault(require("execa"));
  _execa = function () {
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
var _yarn = require("./yarn");
var _bun = require("./bun");
var _npm = require("./npm");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const packageManagers = {
  yarn: {
    init: ['init', '-y'],
    install: ['add'],
    installDev: ['add', '-D'],
    uninstall: ['remove'],
    installAll: ['install']
  },
  npm: {
    init: ['init', '-y'],
    install: ['install', '--save', '--save-exact'],
    installDev: ['install', '--save-dev', '--save-exact'],
    uninstall: ['uninstall', '--save'],
    installAll: ['install']
  },
  bun: {
    init: ['init', '-y'],
    install: ['add', '--exact'],
    installDev: ['add', '--dev', '--exact'],
    uninstall: ['remove'],
    installAll: ['install']
  }
};
function configurePackageManager(packageNames, action, options) {
  let yarnAvailable = shouldUseYarn(options);
  let bunAvailable = shouldUseBun(options);
  let pm = 'npm';
  if (options.packageManager === 'bun') {
    if (bunAvailable) {
      pm = 'bun';
    } else if (yarnAvailable) {
      pm = 'yarn';
    } else {
      pm = 'npm';
    }
  }
  if (options.packageManager === 'yarn' && yarnAvailable) {
    pm = 'yarn';
  }
  const [executable, ...flags] = packageManagers[pm][action];
  const args = [executable, ...flags, ...packageNames];
  return executeCommand(pm, args, options);
}
function executeCommand(command, args, options) {
  return (0, _execa().default)(command, args, {
    stdio: options.silent && !_cliTools().logger.isVerbose() ? 'pipe' : 'inherit',
    cwd: options.root
  });
}
function shouldUseYarn(options) {
  if (options.packageManager === 'yarn') {
    return (0, _yarn.getYarnVersionIfAvailable)();
  }
  return (0, _yarn.isProjectUsingYarn)(options.root) && (0, _yarn.getYarnVersionIfAvailable)();
}
function shouldUseBun(options) {
  if (options.packageManager === 'bun') {
    return (0, _bun.getBunVersionIfAvailable)();
  }
  return (0, _bun.isProjectUsingBun)(options.root) && (0, _bun.getBunVersionIfAvailable)();
}
function shouldUseNpm(options) {
  if (options.packageManager === 'npm') {
    return (0, _npm.getNpmVersionIfAvailable)();
  }
  return (0, _npm.isProjectUsingNpm)(options.root) && (0, _npm.getNpmVersionIfAvailable)();
}
function init(options) {
  return configurePackageManager([], 'init', options);
}
function install(packageNames, options) {
  return configurePackageManager(packageNames, 'install', options);
}
function installDev(packageNames, options) {
  return configurePackageManager(packageNames, 'installDev', options);
}
function uninstall(packageNames, options) {
  return configurePackageManager(packageNames, 'uninstall', options);
}
function installAll(options) {
  return configurePackageManager([], 'installAll', options);
}

//# sourceMappingURL=packageManager.ts.map