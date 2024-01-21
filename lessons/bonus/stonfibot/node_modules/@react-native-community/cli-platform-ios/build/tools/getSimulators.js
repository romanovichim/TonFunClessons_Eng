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
function _child_process() {
  const data = _interopRequireDefault(require("child_process"));
  _child_process = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const getSimulators = () => {
  let simulators;
  try {
    simulators = JSON.parse(_child_process().default.execFileSync('xcrun', ['simctl', 'list', '--json', 'devices'], {
      encoding: 'utf8'
    }));
  } catch (error) {
    throw new (_cliTools().CLIError)('Could not get the simulator list from Xcode. Please open Xcode and try running project directly from there to resolve the remaining issues.');
  }
  return simulators;
};
var _default = getSimulators;
exports.default = _default;

//# sourceMappingURL=getSimulators.ts.map