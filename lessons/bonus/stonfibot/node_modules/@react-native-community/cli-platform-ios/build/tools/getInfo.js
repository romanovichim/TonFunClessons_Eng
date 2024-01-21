"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getInfo = getInfo;
function _execa() {
  const data = _interopRequireDefault(require("execa"));
  _execa = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function getInfo() {
  try {
    const value = JSON.parse(_execa().default.sync('xcodebuild', ['-list', '-json']).stdout);
    if ('project' in value) {
      return value.project;
    } else if ('workspace' in value) {
      return value.workspace;
    }
    return undefined;
  } catch (error) {
    var _ref;
    if (((_ref = error) === null || _ref === void 0 ? void 0 : _ref.message) && error.message.includes('xcodebuild: error:')) {
      const match = error.message.match(/xcodebuild: error: (.*)/);
      const err = match ? match[0] : error;
      throw new Error(err);
    }
    throw new Error(error);
  }
}

//# sourceMappingURL=getInfo.ts.map