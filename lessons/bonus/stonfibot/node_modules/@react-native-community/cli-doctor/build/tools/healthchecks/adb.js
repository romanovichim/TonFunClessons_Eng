"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _cliPlatformAndroid() {
  const data = require("@react-native-community/cli-platform-android");
  _cliPlatformAndroid = function () {
    return data;
  };
  return data;
}
function _child_process() {
  const data = require("child_process");
  _child_process = function () {
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
var _default = {
  label: 'Adb',
  description: 'Required to verify if the android device is attached correctly',
  getDiagnostics: async () => {
    const adbPath = (0, _cliPlatformAndroid().getAdbPath)();
    const devices = _cliPlatformAndroid().adb.getDevices(adbPath);
    if (devices.length > 0) {
      const adbArgs = ['reverse', '--list'];
      const reverseList = (0, _child_process().execFileSync)(adbPath, adbArgs, {
        encoding: 'utf8'
      });
      if (reverseList.length > 0) {
        return {
          needsToBeFixed: false
        };
      } else {
        return {
          description: 'The reverse proxy for the Android device has not been set.',
          needsToBeFixed: true
        };
      }
    } else {
      return {
        description: 'No devices and/or emulators connected. Please create emulator with Android Studio or connect Android device.',
        needsToBeFixed: true
      };
    }
  },
  runAutomaticFix: async ({
    loader,
    logManualInstallation
  }) => {
    loader.fail();
    let hash;
    switch (_cliTools().link.getOS()) {
      case 'macos':
        hash = 'method-1-using-adb-reverse-recommended';
        break;
      case 'windows':
        hash = 'method-1-using-adb-reverse-recommended-1';
        break;
      case 'linux':
        hash = 'method-1-using-adb-reverse-recommended-2';
        break;
      default:
        hash = '';
        break;
    }
    try {
      const device = await (0, _cliPlatformAndroid().listAndroidDevices)();
      if (device && device.connected) {
        (0, _cliPlatformAndroid().tryRunAdbReverse)(process.env.RCT_METRO_PORT || 8081, device.deviceId);
      }
      return loader.succeed();
    } catch (e) {
      return logManualInstallation({
        healthcheck: 'Adb',
        url: _cliTools().link.docs('running-on-device', 'android', {
          hash: hash,
          guide: 'native'
        })
      });
    }
  }
};
exports.default = _default;

//# sourceMappingURL=adb.ts.map