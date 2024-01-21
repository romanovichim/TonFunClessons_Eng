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
var _checkInstallation = require("../checkInstallation");
var _common = require("./common");
var _versionRanges = _interopRequireDefault(require("../versionRanges"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const label = 'CocoaPods';
var _default = {
  label,
  description: 'Required for installing iOS dependencies',
  getDiagnostics: async ({
    Managers
  }) => ({
    needsToBeFixed: (0, _checkInstallation.doesSoftwareNeedToBeFixed)({
      version: Managers.CocoaPods.version,
      versionRange: _versionRanges.default.COCOAPODS
    }),
    version: Managers.CocoaPods.version,
    versionRange: _versionRanges.default.COCOAPODS
  }),
  runAutomaticFix: async ({
    loader
  }) => {
    loader.stop();
    const installMethodCapitalized = 'Gem';
    const loaderInstallationMessage = `${label} (installing with ${installMethodCapitalized})`;
    const loaderSucceedMessage = `${label} (installed with ${installMethodCapitalized})`;
    loader.start(loaderInstallationMessage);
    const options = ['install', 'cocoapods', '--no-document'];
    try {
      // First attempt to install `cocoapods`
      await (0, _execa().default)('gem', options);
      return loader.succeed(loaderSucceedMessage);
    } catch (_error) {
      // If that doesn't work then try with sudo
      try {
        await (0, _cliTools().runSudo)(`gem ${options.join(' ')}`);
        return loader.succeed(loaderSucceedMessage);
      } catch (error) {
        (0, _common.logError)({
          healthcheck: label,
          loader,
          error: error,
          command: 'sudo gem install cocoapods'
        });
      }
    }
    return;
  }
};
exports.default = _default;

//# sourceMappingURL=cocoaPods.ts.map