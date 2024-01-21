"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _promises() {
  const data = _interopRequireDefault(require("fs/promises"));
  _promises = function () {
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
function _cliTools() {
  const data = require("@react-native-community/cli-tools");
  _cliTools = function () {
    return data;
  };
  return data;
}
var _common = require("./common");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const label = 'Gradlew';
const description = 'Build tool required for Android builds';
const platform = process.platform;
var _default = {
  label,
  description,
  getDiagnostics: async (_, config) => {
    var _config$project$andro;
    const projectRoot = (0, _cliTools().findProjectRoot)();
    const filename = platform === 'win32' ? 'gradlew.bat' : 'gradlew';
    const androidFolderPath = (config === null || config === void 0 ? void 0 : (_config$project$andro = config.project.android) === null || _config$project$andro === void 0 ? void 0 : _config$project$andro.sourceDir) ?? `${projectRoot}/android`;
    const gradleWrapperFile = _path().default.join(androidFolderPath, filename);
    const executableMode = _promises().default.constants.X_OK;
    try {
      await _promises().default.access(gradleWrapperFile, executableMode);
      return {
        needsToBeFixed: false
      };
    } catch {
      return {
        needsToBeFixed: true
      };
    }
  },
  runAutomaticFix: async ({
    loader,
    config
  }) => {
    try {
      var _config$project$andro2;
      const projectRoot = (config === null || config === void 0 ? void 0 : config.root) ?? (0, _cliTools().findProjectRoot)();
      const filename = platform === 'win32' ? 'gradlew.bat' : 'gradlew';
      const androidFolderPath = (config === null || config === void 0 ? void 0 : (_config$project$andro2 = config.project.android) === null || _config$project$andro2 === void 0 ? void 0 : _config$project$andro2.sourceDir) ?? `${projectRoot}/android`;
      const gradleWrapperFile = _path().default.join(androidFolderPath, filename);
      const PERMISSIONS = 0o755;
      await _promises().default.chmod(gradleWrapperFile, PERMISSIONS);
    } catch (error) {
      (0, _common.logError)({
        healthcheck: label,
        loader,
        error: error,
        command: 'chmod +x gradlew'
      });
    }
  }
};
exports.default = _default;

//# sourceMappingURL=gradle.ts.map