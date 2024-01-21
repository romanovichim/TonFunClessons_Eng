"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.promptForConfigurationSelection = promptForConfigurationSelection;
exports.promptForDeviceSelection = promptForDeviceSelection;
exports.promptForSchemeSelection = promptForSchemeSelection;
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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
async function promptForSchemeSelection(schemes) {
  const {
    scheme
  } = await (0, _cliTools().prompt)({
    name: 'scheme',
    type: 'select',
    message: 'Select the scheme you want to use',
    choices: schemes.map(value => ({
      title: value,
      value: value
    }))
  });
  return scheme;
}
async function promptForConfigurationSelection(configurations) {
  const {
    configuration
  } = await (0, _cliTools().prompt)({
    name: 'configuration',
    type: 'select',
    message: 'Select the configuration you want to use',
    choices: configurations.map(value => ({
      title: value,
      value: value
    }))
  });
  return configuration;
}
async function promptForDeviceSelection(availableDevices) {
  const {
    device
  } = await (0, _cliTools().prompt)({
    type: 'select',
    name: 'device',
    message: 'Select the device you want to use',
    choices: availableDevices.filter(d => d.type === 'device' || d.type === 'simulator').map(d => ({
      title: `${_chalk().default.bold(d.name)} ${!d.isAvailable && !!d.availabilityError ? _chalk().default.red(`(unavailable - ${d.availabilityError})`) : ''}`,
      value: d,
      disabled: !d.isAvailable
    })),
    min: 1
  });
  return device;
}

//# sourceMappingURL=prompts.ts.map