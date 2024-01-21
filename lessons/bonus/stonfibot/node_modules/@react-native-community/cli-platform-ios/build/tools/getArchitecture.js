"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getArchitecture;
function _fsExtra() {
  const data = require("fs-extra");
  _fsExtra = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
async function getArchitecture(iosSourceDir) {
  try {
    const project = await (0, _fsExtra().readFile)(_path().default.join(iosSourceDir, '/Pods/Pods.xcodeproj/project.pbxproj'));
    return project.includes('-DRCT_NEW_ARCH_ENABLED=1');
  } catch {
    return false;
  }
}

//# sourceMappingURL=getArchitecture.ts.map