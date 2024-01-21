"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = runSudo;
function _sudoPrompt() {
  const data = _interopRequireDefault(require("sudo-prompt"));
  _sudoPrompt = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function runSudo(command) {
  return new Promise((resolve, reject) => {
    _sudoPrompt().default.exec(command, {
      name: 'React Native CLI'
    }, error => {
      if (error) {
        reject(error);
      }
      resolve();
    });
  });
}

//# sourceMappingURL=runSudo.ts.map