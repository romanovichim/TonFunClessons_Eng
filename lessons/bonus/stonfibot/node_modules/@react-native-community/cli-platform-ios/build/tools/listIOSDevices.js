"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _execa() {
  const data = _interopRequireDefault(require("execa"));
  _execa = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const parseXcdeviceList = text => {
  const rawOutput = JSON.parse(text);
  const devices = rawOutput.filter(device => !device.platform.includes('appletv') && !device.platform.includes('macos')).sort(device => device.simulator ? 1 : -1).map(device => {
    var _device$error;
    return {
      isAvailable: device.available,
      name: device.name,
      udid: device.identifier,
      version: device.operatingSystemVersion,
      availabilityError: (_device$error = device.error) === null || _device$error === void 0 ? void 0 : _device$error.description,
      type: device.simulator ? 'simulator' : 'device'
    };
  });
  return devices;
};
async function listIOSDevices() {
  const out = _execa().default.sync('xcrun', ['xcdevice', 'list']).stdout;
  return parseXcdeviceList(out);
}
var _default = listIOSDevices;
exports.default = _default;

//# sourceMappingURL=listIOSDevices.ts.map