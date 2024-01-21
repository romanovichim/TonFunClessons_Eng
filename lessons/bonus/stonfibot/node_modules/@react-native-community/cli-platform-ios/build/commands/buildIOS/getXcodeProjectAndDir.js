"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getXcodeProjectAndDir = getXcodeProjectAndDir;
function _cliTools() {
  const data = require("@react-native-community/cli-tools");
  _cliTools = function () {
    return data;
  };
  return data;
}
function getXcodeProjectAndDir(iosProjectConfig) {
  if (!iosProjectConfig) {
    throw new (_cliTools().CLIError)('iOS project folder not found. Are you sure this is a React Native project?');
  }
  const {
    xcodeProject,
    sourceDir
  } = iosProjectConfig;
  if (!xcodeProject) {
    throw new (_cliTools().CLIError)(`Could not find Xcode project files in "${sourceDir}" folder`);
  }
  return {
    xcodeProject,
    sourceDir
  };
}

//# sourceMappingURL=getXcodeProjectAndDir.ts.map