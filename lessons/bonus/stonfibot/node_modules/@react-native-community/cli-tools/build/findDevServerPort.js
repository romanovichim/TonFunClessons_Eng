"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _handlePortUnavailable = _interopRequireDefault(require("./handlePortUnavailable"));
var _isPackagerRunning = _interopRequireDefault(require("./isPackagerRunning"));
var _port = require("./port");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const findDevServerPort = async (initialPort, root) => {
  let port = initialPort;
  let startPackager = true;
  const packagerStatus = await (0, _isPackagerRunning.default)(port);
  if (typeof packagerStatus === 'object' && packagerStatus.status === 'running') {
    if (packagerStatus.root === root) {
      startPackager = false;
      (0, _port.logAlreadyRunningBundler)(port);
    } else {
      const result = await (0, _handlePortUnavailable.default)(port, root);
      [port, startPackager] = [result.port, result.packager];
    }
  } else if (packagerStatus === 'unrecognized') {
    const result = await (0, _handlePortUnavailable.default)(port, root);
    [port, startPackager] = [result.port, result.packager];
  }
  return {
    port,
    startPackager
  };
};
var _default = findDevServerPort;
exports.default = _default;

//# sourceMappingURL=findDevServerPort.ts.map