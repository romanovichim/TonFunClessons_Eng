"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.selectFromInteractiveMode = selectFromInteractiveMode;
function _cliTools() {
  const data = require("@react-native-community/cli-tools");
  _cliTools = function () {
    return data;
  };
  return data;
}
function _chalk() {
  const data = _interopRequireDefault(require("chalk"));
  _chalk = function () {
    return data;
  };
  return data;
}
var _prompts = require("./prompts");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
async function selectFromInteractiveMode({
  scheme,
  mode,
  info
}) {
  let newScheme = scheme;
  let newMode = mode;
  const schemes = info === null || info === void 0 ? void 0 : info.schemes;
  if (schemes && schemes.length > 1) {
    newScheme = await (0, _prompts.promptForSchemeSelection)(schemes);
  } else {
    _cliTools().logger.info(`Automatically selected ${_chalk().default.bold(scheme)} scheme.`);
  }
  const configurations = info === null || info === void 0 ? void 0 : info.configurations;
  if (configurations && configurations.length > 1) {
    newMode = await (0, _prompts.promptForConfigurationSelection)(configurations);
  } else {
    _cliTools().logger.info(`Automatically selected ${_chalk().default.bold(mode)} configuration.`);
  }
  return {
    scheme: newScheme,
    mode: newMode
  };
}

//# sourceMappingURL=selectFromInteractiveMode.ts.map