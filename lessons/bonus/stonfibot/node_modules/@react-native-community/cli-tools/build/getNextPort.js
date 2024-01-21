"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _isPackagerRunning = _interopRequireDefault(require("./isPackagerRunning"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Increases by one the port number until it finds an available port.
 * @param port Port number to start with.
 * @param root Root of the project.
 */

const getNextPort = async (port, root) => {
  let nextPort = port + 1;
  let start = true;
  const result = await (0, _isPackagerRunning.default)(nextPort);
  const isRunning = typeof result === 'object' && result.status === 'running';
  if (isRunning && result.root === root) {
    // Found running bundler for this project, so we do not need to start packager!
    start = false;
  } else if (isRunning || result === 'unrecognized') {
    return getNextPort(nextPort, root);
  }
  return {
    start,
    nextPort
  };
};
var _default = getNextPort;
exports.default = _default;

//# sourceMappingURL=getNextPort.ts.map