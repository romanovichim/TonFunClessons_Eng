"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _checkInstallation = require("../checkInstallation");
var _brewInstall = require("../brewInstall");
function _chalk() {
  const data = _interopRequireDefault(require("chalk"));
  _chalk = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const packageName = 'ios-deploy';
var _default = {
  label: packageName,
  isRequired: false,
  description: 'Required for installing your app on a physical device with the CLI',
  getDiagnostics: async () => ({
    needsToBeFixed: await (0, _checkInstallation.isSoftwareNotInstalled)(packageName)
  }),
  runAutomaticFix: async ({
    loader,
    logManualInstallation
  }) => {
    await (0, _brewInstall.brewInstall)({
      pkg: packageName,
      label: packageName,
      loader,
      onSuccess: () => {
        loader.succeed(`Successfully installed ${_chalk().default.bold(packageName)} with Homebrew`);
      },
      onFail: () => {
        loader.fail();
        logManualInstallation({
          healthcheck: packageName,
          url: 'https://github.com/ios-control/ios-deploy#installation'
        });
      }
    });
  }
};
exports.default = _default;

//# sourceMappingURL=iosDeploy.ts.map