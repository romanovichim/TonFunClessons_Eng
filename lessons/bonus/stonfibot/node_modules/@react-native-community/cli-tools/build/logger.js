"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _chalk() {
  const data = _interopRequireDefault(require("chalk"));
  _chalk = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const SEPARATOR = ', ';
let verbose = false;
let disabled = false;
let hidden = false;
const formatMessages = messages => _chalk().default.reset(messages.join(SEPARATOR));
const success = (...messages) => {
  if (!disabled) {
    console.log(`${_chalk().default.green.bold('success')} ${formatMessages(messages)}`);
  }
};
const info = (...messages) => {
  if (!disabled) {
    console.log(`${_chalk().default.cyan.bold('info')} ${formatMessages(messages)}`);
  }
};
const warn = (...messages) => {
  if (!disabled) {
    console.warn(`${_chalk().default.yellow.bold('warn')} ${formatMessages(messages)}`);
  }
};
const error = (...messages) => {
  if (!disabled) {
    console.error(`${_chalk().default.red.bold('error')} ${formatMessages(messages)}`);
  }
};
const debug = (...messages) => {
  if (verbose && !disabled) {
    console.log(`${_chalk().default.gray.bold('debug')} ${formatMessages(messages)}`);
  } else {
    hidden = true;
  }
};
const log = (...messages) => {
  if (!disabled) {
    console.log(`${formatMessages(messages)}`);
  }
};
const setVerbose = level => {
  verbose = level;
};
const isVerbose = () => verbose;
const disable = () => {
  disabled = true;
};
const enable = () => {
  disabled = false;
};
const hasDebugMessages = () => hidden;
var _default = {
  success,
  info,
  warn,
  error,
  debug,
  log,
  setVerbose,
  isVerbose,
  hasDebugMessages,
  disable,
  enable
};
exports.default = _default;

//# sourceMappingURL=logger.ts.map