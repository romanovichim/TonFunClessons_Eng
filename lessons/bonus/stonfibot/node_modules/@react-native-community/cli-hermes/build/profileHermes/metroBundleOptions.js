"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getMetroBundleOptions = getMetroBundleOptions;
function _cliTools() {
  const data = require("@react-native-community/cli-tools");
  _cliTools = function () {
    return data;
  };
  return data;
}
function _fs() {
  const data = _interopRequireDefault(require("fs"));
  _fs = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function getMetroBundleOptions(downloadedProfileFilePath) {
  let options = {
    platform: 'android',
    dev: true,
    minify: false
  };
  try {
    const contents = JSON.parse(_fs().default.readFileSync(downloadedProfileFilePath, {
      encoding: 'utf8'
    }));
    const matchBundleUrl = /^.*\((.*index\.bundle.*)\)/;
    let containsExpoDevMenu = false;
    let hadMatch = false;
    for (const frame of Object.values(contents.stackFrames)) {
      if (frame.name.includes('EXDevMenuApp')) {
        containsExpoDevMenu = true;
      }
      const match = matchBundleUrl.exec(frame.name);
      if (match) {
        const parsed = new URL(match[1]);
        const platform = parsed.searchParams.get('platform'),
          dev = parsed.searchParams.get('dev'),
          minify = parsed.searchParams.get('minify');
        if (platform) {
          options.platform = platform;
        }
        if (dev) {
          options.dev = dev === 'true';
        }
        if (minify) {
          options.minify = minify === 'true';
        }
        hadMatch = true;
        break;
      }
    }
    if (containsExpoDevMenu && !hadMatch) {
      _cliTools().logger.warn(`Found references to the Expo Dev Menu in your profiling sample.
You might have accidentally recorded the Expo Dev Menu instead of your own application.
To work around this, please reload your app twice before starting a profiler recording.`);
    }
  } catch (e) {
    throw e;
  }
  return options;
}

//# sourceMappingURL=metroBundleOptions.ts.map