"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkIfConfigurationExists = checkIfConfigurationExists;
function _cliTools() {
  const data = require("@react-native-community/cli-tools");
  _cliTools = function () {
    return data;
  };
  return data;
}
function checkIfConfigurationExists(configurations, mode) {
  if (configurations.length === 0) {
    _cliTools().logger.warn(`Unable to check whether "${mode}" exists in your project`);
    return;
  }
  if (!configurations.includes(mode)) {
    throw new (_cliTools().CLIError)(`Configuration "${mode}" does not exist in your project. Please use one of the existing configurations: ${configurations.join(', ')}`);
  }
}

//# sourceMappingURL=checkIfConfigurationExists.ts.map