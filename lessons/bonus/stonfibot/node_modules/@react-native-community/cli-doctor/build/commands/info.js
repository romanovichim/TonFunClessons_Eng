"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _envinfo = _interopRequireDefault(require("../tools/envinfo"));
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
function _fsExtra() {
  const data = require("fs-extra");
  _fsExtra = function () {
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
function _yaml() {
  const data = require("yaml");
  _yaml = function () {
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
 */

const info = async function getInfo(_argv, ctx) {
  try {
    var _ctx$project$ios, _ctx$project$android;
    _cliTools().logger.info('Fetching system and libraries information...');
    const notFound = 'Not found';
    const platforms = {
      Android: {
        hermesEnabled: notFound,
        newArchEnabled: notFound
      },
      iOS: {
        hermesEnabled: notFound,
        newArchEnabled: notFound
      }
    };
    if (process.platform !== 'win32' && ((_ctx$project$ios = ctx.project.ios) === null || _ctx$project$ios === void 0 ? void 0 : _ctx$project$ios.sourceDir)) {
      try {
        const podfile = await (0, _fsExtra().readFile)(_path().default.join(ctx.project.ios.sourceDir, '/Podfile.lock'), 'utf8');
        platforms.iOS.hermesEnabled = podfile.includes('hermes-engine');
      } catch (e) {
        platforms.iOS.hermesEnabled = notFound;
      }
      try {
        const isNewArchitecture = await (0, _cliPlatformIos().getArchitecture)(ctx.project.ios.sourceDir);
        platforms.iOS.newArchEnabled = isNewArchitecture;
      } catch {
        platforms.iOS.newArchEnabled = notFound;
      }
    }
    if ((_ctx$project$android = ctx.project.android) === null || _ctx$project$android === void 0 ? void 0 : _ctx$project$android.sourceDir) {
      try {
        const gradleProperties = await (0, _fsExtra().readFile)(_path().default.join(ctx.project.android.sourceDir, '/gradle.properties'), 'utf8');
        platforms.Android.hermesEnabled = gradleProperties.includes('hermesEnabled=true');
        platforms.Android.newArchEnabled = gradleProperties.includes('newArchEnabled=true');
      } catch {
        platforms.Android.hermesEnabled = notFound;
        platforms.Android.newArchEnabled = notFound;
      }
    }
    const output = await (0, _envinfo.default)();
    _cliTools().logger.log((0, _yaml().stringify)({
      ...output,
      ...platforms
    }));
  } catch (err) {
    _cliTools().logger.error(`Unable to print environment info.\n${err}`);
  } finally {
    await _cliTools().version.logIfUpdateAvailable(ctx.root);
  }
};
var _default = {
  name: 'info',
  description: 'Get relevant version info about OS, toolchain and libraries',
  func: info
};
exports.default = _default;

//# sourceMappingURL=info.ts.map