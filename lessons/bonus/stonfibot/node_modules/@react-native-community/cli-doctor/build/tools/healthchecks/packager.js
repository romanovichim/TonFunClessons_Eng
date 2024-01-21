"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _cliTools() {
  const data = require("@react-native-community/cli-tools");
  _cliTools = function () {
    return data;
  };
  return data;
}
var _common = require("./common");
function _execa() {
  const data = _interopRequireDefault(require("execa"));
  _execa = function () {
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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = {
  label: 'Metro',
  isRequired: false,
  description: 'Required for bundling the JavaScript code',
  getDiagnostics: async () => {
    const status = await (0, _cliTools().isPackagerRunning)();
    const needsToBeFixed = status === 'not_running';
    if (needsToBeFixed) {
      return {
        description: 'Metro Bundler is not running',
        needsToBeFixed
      };
    }
    return {
      needsToBeFixed
    };
  },
  runAutomaticFix: async ({
    loader,
    config
  }) => {
    loader.fail();
    try {
      const terminal = (0, _cliTools().getDefaultUserTerminal)();
      const port = Number(process.env.RCT_METRO_PORT) || 8081;
      if (terminal && config) {
        await (0, _execa().default)('node', [_path().default.join(config.reactNativePath, 'cli.js'), 'start', '--port', port.toString(), '--terminal', terminal]);
        return loader.succeed();
      }
      return (0, _common.logManualInstallation)({
        message: 'Could not start the bundler. Please run "npx react-native start" command manually.'
      });
    } catch (error) {
      return (0, _common.logManualInstallation)({
        message: 'Could not start the bundler. Please run "npx react-native start" command manually.'
      });
    }
  }
};
exports.default = _default;

//# sourceMappingURL=packager.ts.map