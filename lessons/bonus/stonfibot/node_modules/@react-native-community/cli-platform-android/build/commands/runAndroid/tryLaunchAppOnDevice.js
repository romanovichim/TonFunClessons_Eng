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
function _cliTools() {
  const data = require("@react-native-community/cli-tools");
  _cliTools = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function tryLaunchAppOnDevice(device, androidProject, adbPath, args) {
  const {
    appId,
    appIdSuffix
  } = args;
  const {
    packageName,
    mainActivity,
    applicationId
  } = androidProject;
  const applicationIdWithSuffix = [appId || applicationId, appIdSuffix].filter(Boolean).join('.');
  const activityToLaunch = mainActivity.includes('.') ? [packageName, mainActivity].join('') : [packageName, mainActivity].filter(Boolean).join('.');
  try {
    // Here we're using the same flags as Android Studio to launch the app
    const adbArgs = ['shell', 'am', 'start', '-n', `${applicationIdWithSuffix}/${activityToLaunch}`, '-a', 'android.intent.action.MAIN', '-c', 'android.intent.category.LAUNCHER'];
    if (device) {
      adbArgs.unshift('-s', device);
      _cliTools().logger.info(`Starting the app on "${device}"...`);
    } else {
      _cliTools().logger.info('Starting the app...');
    }
    _cliTools().logger.debug(`Running command "${adbPath} ${adbArgs.join(' ')}"`);
    _execa().default.sync(adbPath, adbArgs, {
      stdio: 'inherit'
    });
  } catch (error) {
    throw new (_cliTools().CLIError)('Failed to start the app.', error);
  }
}
var _default = tryLaunchAppOnDevice;
exports.default = _default;

//# sourceMappingURL=tryLaunchAppOnDevice.ts.map