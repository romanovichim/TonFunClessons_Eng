"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _execa() {
  const data = _interopRequireDefault(require("execa"));
  _execa = function () {
    return data;
  };
  return data;
}
function _fs() {
  const data = _interopRequireDefault(require("fs"));
  _fs = function () {
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
var _adb = _interopRequireDefault(require("./adb"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function tryInstallAppOnDevice(args, adbPath, device, androidProject, selectedTask) {
  try {
    var _variantFromSelectedT, _variantFromSelectedT2;
    // "app" is usually the default value for Android apps with only 1 app
    const {
      appName,
      sourceDir
    } = androidProject;
    const defaultVariant = (args.mode || 'debug').toLowerCase();

    // handle if selected task from interactive mode includes build flavour as well, eg. installProductionDebug should create ['production','debug'] array
    const variantFromSelectedTask = selectedTask === null || selectedTask === void 0 ? void 0 : selectedTask.replace('install', '').split(/(?=[A-Z])/);

    // create path to output file, eg. `production/debug`
    const variantPath = (variantFromSelectedTask === null || variantFromSelectedTask === void 0 ? void 0 : (_variantFromSelectedT = variantFromSelectedTask.join('/')) === null || _variantFromSelectedT === void 0 ? void 0 : _variantFromSelectedT.toLowerCase()) ?? defaultVariant;
    // create output file name, eg. `production-debug`
    const variantAppName = (variantFromSelectedTask === null || variantFromSelectedTask === void 0 ? void 0 : (_variantFromSelectedT2 = variantFromSelectedTask.join('-')) === null || _variantFromSelectedT2 === void 0 ? void 0 : _variantFromSelectedT2.toLowerCase()) ?? defaultVariant;
    let pathToApk;
    if (!args.binaryPath) {
      const buildDirectory = `${sourceDir}/${appName}/build/outputs/apk/${variantPath}`;
      const apkFile = getInstallApkName(appName, adbPath, variantAppName, device, buildDirectory);
      pathToApk = `${buildDirectory}/${apkFile}`;
    } else {
      pathToApk = args.binaryPath;
    }
    const installArgs = ['-s', device, 'install', '-r', '-d'];
    if (args.user !== undefined) {
      installArgs.push('--user', `${args.user}`);
    }
    const adbArgs = [...installArgs, pathToApk];
    _cliTools().logger.info(`Installing the app on the device "${device}"...`);
    _cliTools().logger.debug(`Running command "cd android && adb ${adbArgs.join(' ')}"`);
    _execa().default.sync(adbPath, adbArgs, {
      stdio: 'inherit'
    });
  } catch (error) {
    throw new (_cliTools().CLIError)('Failed to install the app on the device.', error);
  }
}
function getInstallApkName(appName, adbPath, variant, device, buildDirectory) {
  const availableCPUs = _adb.default.getAvailableCPUs(adbPath, device);

  // check if there is an apk file like app-armeabi-v7a-debug.apk
  for (const availableCPU of availableCPUs.concat('universal')) {
    const apkName = `${appName}-${availableCPU}-${variant}.apk`;
    if (_fs().default.existsSync(`${buildDirectory}/${apkName}`)) {
      return apkName;
    }
  }

  // check if there is a default file like app-debug.apk
  const apkName = `${appName}-${variant}.apk`;
  if (_fs().default.existsSync(`${buildDirectory}/${apkName}`)) {
    return apkName;
  }
  throw new Error('Could not find the correct install APK file.');
}
var _default = tryInstallAppOnDevice;
exports.default = _default;

//# sourceMappingURL=tryInstallAppOnDevice.ts.map