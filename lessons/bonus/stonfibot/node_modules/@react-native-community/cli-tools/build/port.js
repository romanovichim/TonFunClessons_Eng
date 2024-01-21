"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.logChangePortInstructions = exports.logAlreadyRunningBundler = exports.askForPortChange = void 0;
var _prompt = require("./prompt");
var _logger = _interopRequireDefault(require("./logger"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const askForPortChange = async (port, nextPort) => {
  _logger.default.info(`Another process is running on port ${port}.`);
  return await (0, _prompt.prompt)({
    name: 'change',
    type: 'select',
    message: `Use port ${nextPort} instead?`,
    choices: [{
      title: 'Yes',
      value: true
    }, {
      title: 'No',
      value: false
    }]
  });
};
exports.askForPortChange = askForPortChange;
const logAlreadyRunningBundler = port => {
  _logger.default.info(`A dev server is already running for this project on port ${port}.`);
};
exports.logAlreadyRunningBundler = logAlreadyRunningBundler;
const logChangePortInstructions = () => {
  _logger.default.info('Please terminate this process and try again, or use another port with "--port".');
};
exports.logChangePortInstructions = logChangePortInstructions;

//# sourceMappingURL=port.ts.map