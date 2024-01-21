"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _logger = _interopRequireDefault(require("./logger"));
function _chalk() {
  const data = _interopRequireDefault(require("chalk"));
  _chalk = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const printRunDoctorTip = () => {
  const linkToDocs = 'https://github.com/react-native-community/cli/blob/main/packages/cli-doctor/README.md#doctor';
  _logger.default.log('');
  _logger.default.info(_chalk().default.dim(`${_chalk().default.dim('💡 Tip: Make sure that you have set up your development environment correctly, by running')} ${_chalk().default.reset(_chalk().default.bold('npx react-native doctor'))}. ${_chalk().default.dim(`To read more about doctor command visit: ${linkToDocs} \n`)}`));
};
var _default = printRunDoctorTip;
exports.default = _default;

//# sourceMappingURL=printRunDoctorTip.ts.map