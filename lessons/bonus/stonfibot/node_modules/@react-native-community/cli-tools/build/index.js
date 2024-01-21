"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  logger: true,
  isPackagerRunning: true,
  getDefaultUserTerminal: true,
  fetch: true,
  fetchToTemp: true,
  launchDefaultBrowser: true,
  launchDebugger: true,
  launchEditor: true,
  version: true,
  resolveNodeModuleDir: true,
  getLoader: true,
  NoopLoader: true,
  Loader: true,
  findProjectRoot: true,
  printRunDoctorTip: true,
  link: true,
  startServerInNewWindow: true,
  findDevServerPort: true,
  cacheManager: true,
  runSudo: true
};
Object.defineProperty(exports, "Loader", {
  enumerable: true,
  get: function () {
    return _loader.Loader;
  }
});
Object.defineProperty(exports, "NoopLoader", {
  enumerable: true,
  get: function () {
    return _loader.NoopLoader;
  }
});
Object.defineProperty(exports, "cacheManager", {
  enumerable: true,
  get: function () {
    return _cacheManager.default;
  }
});
Object.defineProperty(exports, "fetch", {
  enumerable: true,
  get: function () {
    return _fetch.fetch;
  }
});
Object.defineProperty(exports, "fetchToTemp", {
  enumerable: true,
  get: function () {
    return _fetch.fetchToTemp;
  }
});
Object.defineProperty(exports, "findDevServerPort", {
  enumerable: true,
  get: function () {
    return _findDevServerPort.default;
  }
});
Object.defineProperty(exports, "findProjectRoot", {
  enumerable: true,
  get: function () {
    return _findProjectRoot.default;
  }
});
Object.defineProperty(exports, "getDefaultUserTerminal", {
  enumerable: true,
  get: function () {
    return _getDefaultUserTerminal.default;
  }
});
Object.defineProperty(exports, "getLoader", {
  enumerable: true,
  get: function () {
    return _loader.getLoader;
  }
});
Object.defineProperty(exports, "isPackagerRunning", {
  enumerable: true,
  get: function () {
    return _isPackagerRunning.default;
  }
});
Object.defineProperty(exports, "launchDebugger", {
  enumerable: true,
  get: function () {
    return _launchDebugger.default;
  }
});
Object.defineProperty(exports, "launchDefaultBrowser", {
  enumerable: true,
  get: function () {
    return _launchDefaultBrowser.default;
  }
});
Object.defineProperty(exports, "launchEditor", {
  enumerable: true,
  get: function () {
    return _launchEditor.default;
  }
});
exports.link = void 0;
Object.defineProperty(exports, "logger", {
  enumerable: true,
  get: function () {
    return _logger.default;
  }
});
Object.defineProperty(exports, "printRunDoctorTip", {
  enumerable: true,
  get: function () {
    return _printRunDoctorTip.default;
  }
});
Object.defineProperty(exports, "resolveNodeModuleDir", {
  enumerable: true,
  get: function () {
    return _resolveNodeModuleDir.default;
  }
});
Object.defineProperty(exports, "runSudo", {
  enumerable: true,
  get: function () {
    return _runSudo.default;
  }
});
Object.defineProperty(exports, "startServerInNewWindow", {
  enumerable: true,
  get: function () {
    return _startServerInNewWindow.default;
  }
});
exports.version = void 0;
var _logger = _interopRequireDefault(require("./logger"));
var _isPackagerRunning = _interopRequireDefault(require("./isPackagerRunning"));
var _getDefaultUserTerminal = _interopRequireDefault(require("./getDefaultUserTerminal"));
var _fetch = require("./fetch");
var _launchDefaultBrowser = _interopRequireDefault(require("./launchDefaultBrowser"));
var _launchDebugger = _interopRequireDefault(require("./launchDebugger"));
var _launchEditor = _interopRequireDefault(require("./launchEditor"));
var _version = _interopRequireWildcard(require("./releaseChecker"));
exports.version = _version;
var _resolveNodeModuleDir = _interopRequireDefault(require("./resolveNodeModuleDir"));
var _loader = require("./loader");
var _findProjectRoot = _interopRequireDefault(require("./findProjectRoot"));
var _printRunDoctorTip = _interopRequireDefault(require("./printRunDoctorTip"));
var _prompt = require("./prompt");
Object.keys(_prompt).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _prompt[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _prompt[key];
    }
  });
});
var _link = _interopRequireWildcard(require("./doclink"));
exports.link = _link;
var _startServerInNewWindow = _interopRequireDefault(require("./startServerInNewWindow"));
var _findDevServerPort = _interopRequireDefault(require("./findDevServerPort"));
var _port = require("./port");
Object.keys(_port).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _port[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _port[key];
    }
  });
});
var _cacheManager = _interopRequireDefault(require("./cacheManager"));
var _runSudo = _interopRequireDefault(require("./runSudo"));
var _errors = require("./errors");
Object.keys(_errors).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _errors[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _errors[key];
    }
  });
});
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//# sourceMappingURL=index.ts.map