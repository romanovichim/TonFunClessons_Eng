"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "commands", {
  enumerable: true,
  get: function () {
    return _commands.default;
  }
});
Object.defineProperty(exports, "dependencyConfig", {
  enumerable: true,
  get: function () {
    return _config.dependencyConfig;
  }
});
Object.defineProperty(exports, "findPodfilePaths", {
  enumerable: true,
  get: function () {
    return _config.findPodfilePaths;
  }
});
Object.defineProperty(exports, "getArchitecture", {
  enumerable: true,
  get: function () {
    return _getArchitecture.default;
  }
});
Object.defineProperty(exports, "installPods", {
  enumerable: true,
  get: function () {
    return _installPods.default;
  }
});
Object.defineProperty(exports, "projectConfig", {
  enumerable: true,
  get: function () {
    return _config.projectConfig;
  }
});
var _commands = _interopRequireDefault(require("./commands"));
var _config = require("./config");
var _getArchitecture = _interopRequireDefault(require("./tools/getArchitecture"));
var _installPods = _interopRequireDefault(require("./tools/installPods"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//# sourceMappingURL=index.ts.map