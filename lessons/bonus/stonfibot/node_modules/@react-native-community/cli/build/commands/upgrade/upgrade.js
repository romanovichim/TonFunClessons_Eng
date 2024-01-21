"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _chalk() {
  const data = _interopRequireDefault(require("chalk"));
  _chalk = function () {
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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Upgrade application to a new version of React Native.
 */
async function upgrade(_, {
  root: projectDir
}) {
  var _update$upgrade;
  const url = new URL('https://react-native-community.github.io/upgrade-helper');
  const update = await _cliTools().version.latest(projectDir);
  if (!(update === null || update === void 0 ? void 0 : update.current)) {
    _cliTools().logger.error(`Cannot figure out your version of React Native, use: ${_chalk().default.dim(url.toString())}`);
    process.exit(1);
  }
  const from = update.current;
  const to = (_update$upgrade = update.upgrade) === null || _update$upgrade === void 0 ? void 0 : _update$upgrade.stable;
  if (to === from) {
    _cliTools().logger.success(`You are on the most recent stable release of React Native: ${_chalk().default.white(from)} 🎉.`);
    return;
  }
  url.searchParams.set('from', from);
  if (to) {
    url.searchParams.set('to', to);
  }
  _cliTools().logger.log(`
To upgrade React Native please follow the instructions here:

  ${_chalk().default.dim(url.toString())}
`);
}
const upgradeCommand = {
  name: 'upgrade',
  description: 'Generate a link to the upgrade helper to help you upgrade',
  func: upgrade
};
var _default = upgradeCommand;
exports.default = _default;

//# sourceMappingURL=upgrade.ts.map