"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = printNewRelease;
function _chalk() {
  const data = _interopRequireDefault(require("chalk"));
  _chalk = function () {
    return data;
  };
  return data;
}
var link = _interopRequireWildcard(require("../doclink"));
var _logger = _interopRequireDefault(require("../logger"));
var _cacheManager = _interopRequireDefault(require("../cacheManager"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Notifies the user that a newer version of React Native is available.
 */
function printNewRelease(name, latestRelease, currentVersion) {
  _logger.default.info(`React Native v${latestRelease.stable} is now available (your project is running on v${currentVersion}).`);
  _logger.default.info(`Changelog: ${_chalk().default.dim.underline(latestRelease.changelogUrl)}`);
  _logger.default.info(`Diff: ${_chalk().default.dim.underline(latestRelease.diffUrl)}`);
  _logger.default.info(`For more info, check out "${_chalk().default.dim.underline(link.docs('upgrading', 'none'))}".`);
  _cacheManager.default.set(name, 'lastChecked', new Date().toISOString());
}

//# sourceMappingURL=printNewRelease.ts.map