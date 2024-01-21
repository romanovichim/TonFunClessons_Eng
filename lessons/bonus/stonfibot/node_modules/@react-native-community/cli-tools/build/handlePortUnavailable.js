"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _getNextPort = _interopRequireDefault(require("./getNextPort"));
var _port = require("./port");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const handlePortUnavailable = async (initialPort, projectRoot) => {
  const {
    nextPort,
    start
  } = await (0, _getNextPort.default)(initialPort, projectRoot);
  let packager = true;
  let port = initialPort;
  if (!start) {
    packager = false;
    (0, _port.logAlreadyRunningBundler)(nextPort);
  } else {
    const {
      change
    } = await (0, _port.askForPortChange)(port, nextPort);
    if (change) {
      port = nextPort;
    } else {
      packager = false;
      (0, _port.logChangePortInstructions)();
    }
  }
  return {
    port,
    packager
  };
};
var _default = handlePortUnavailable;
exports.default = _default;

//# sourceMappingURL=handlePortUnavailable.ts.map