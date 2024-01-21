"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getConfiguration = getConfiguration;
function _chalk() {
  const data = _interopRequireDefault(require("chalk"));
  _chalk = function () {
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
var _selectFromInteractiveMode = require("../../tools/selectFromInteractiveMode");
var _getInfo = require("../../tools/getInfo");
var _checkIfConfigurationExists = require("../../tools/checkIfConfigurationExists");
var _getBuildConfigurationFromXcScheme = require("../../tools/getBuildConfigurationFromXcScheme");
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
async function getConfiguration(xcodeProject, sourceDir, args) {
  const info = (0, _getInfo.getInfo)();
  if (args.mode) {
    (0, _checkIfConfigurationExists.checkIfConfigurationExists)((info === null || info === void 0 ? void 0 : info.configurations) ?? [], args.mode);
  }
  let scheme = args.scheme || _path().default.basename(xcodeProject.name, _path().default.extname(xcodeProject.name));
  let mode = args.mode || (0, _getBuildConfigurationFromXcScheme.getBuildConfigurationFromXcScheme)(scheme, 'Debug', sourceDir, info);
  if (args.interactive) {
    const selection = await (0, _selectFromInteractiveMode.selectFromInteractiveMode)({
      scheme,
      mode,
      info
    });
    if (selection.scheme) {
      scheme = selection.scheme;
    }
    if (selection.mode) {
      mode = selection.mode;
    }
  }
  _cliTools().logger.info(`Found Xcode ${xcodeProject.isWorkspace ? 'workspace' : 'project'} "${_chalk().default.bold(xcodeProject.name)}"`);
  return {
    scheme,
    mode
  };
}

//# sourceMappingURL=getConfiguration.ts.map