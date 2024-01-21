"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getHealthchecks = exports.HEALTHCHECK_TYPES = void 0;
var _nodeJS = _interopRequireDefault(require("./nodeJS"));
var _packageManagers = require("./packageManagers");
var _adb = _interopRequireDefault(require("./adb"));
var _jdk = _interopRequireDefault(require("./jdk"));
var _watchman = _interopRequireDefault(require("./watchman"));
var _ruby = _interopRequireDefault(require("./ruby"));
var _androidHomeEnvVariable = _interopRequireDefault(require("./androidHomeEnvVariable"));
var _androidStudio = _interopRequireDefault(require("./androidStudio"));
var _androidSDK = _interopRequireDefault(require("./androidSDK"));
var _androidNDK = _interopRequireDefault(require("./androidNDK"));
var _xcode = _interopRequireDefault(require("./xcode"));
var _cocoaPods = _interopRequireDefault(require("./cocoaPods"));
var _iosDeploy = _interopRequireDefault(require("./iosDeploy"));
function _cliConfig() {
  const data = _interopRequireDefault(require("@react-native-community/cli-config"));
  _cliConfig = function () {
    return data;
  };
  return data;
}
var _xcodeEnv = _interopRequireDefault(require("./xcodeEnv"));
var _packager = _interopRequireDefault(require("./packager"));
var _gradle = _interopRequireDefault(require("./gradle"));
function _deepmerge() {
  const data = _interopRequireDefault(require("deepmerge"));
  _deepmerge = function () {
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
const HEALTHCHECK_TYPES = {
  ERROR: 'ERROR',
  WARNING: 'WARNING'
};
exports.HEALTHCHECK_TYPES = HEALTHCHECK_TYPES;
const getHealthchecks = ({
  contributor
}) => {
  let additionalChecks = [];
  let projectSpecificHealthchecks = {};
  let config;

  // Doctor can run in a detached mode, where there isn't a config so this can fail
  try {
    config = (0, _cliConfig().default)();
    additionalChecks = config.healthChecks;
    if (config.reactNativePath) {
      projectSpecificHealthchecks = {
        common: {
          label: 'Common',
          healthchecks: [_packager.default]
        },
        android: {
          label: 'Android',
          healthchecks: [_androidSDK.default]
        },
        ...(process.platform === 'darwin' && {
          ios: {
            label: 'iOS',
            healthchecks: [_xcodeEnv.default]
          }
        })
      };
    }
  } catch {}
  if (!config) {
    _cliTools().logger.log();
    _cliTools().logger.info('Detected that command has been run outside of React Native project, running basic healthchecks.');
  }
  const defaultHealthchecks = {
    common: {
      label: 'Common',
      healthchecks: [_nodeJS.default, _packageManagers.yarn, _packageManagers.npm, ...(process.platform === 'darwin' ? [_watchman.default] : [])]
    },
    android: {
      label: 'Android',
      healthchecks: [_adb.default, _jdk.default, _androidStudio.default, _androidHomeEnvVariable.default, _gradle.default, ...(contributor ? [_androidNDK.default] : [])]
    },
    ...(process.platform === 'darwin' ? {
      ios: {
        label: 'iOS',
        healthchecks: [_xcode.default, _ruby.default, _cocoaPods.default, _iosDeploy.default]
      }
    } : {}),
    ...additionalChecks
  };
  return (0, _deepmerge().default)(defaultHealthchecks, projectSpecificHealthchecks);
};
exports.getHealthchecks = getHealthchecks;

//# sourceMappingURL=index.ts.map