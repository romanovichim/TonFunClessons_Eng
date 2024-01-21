"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findSourcemap = findSourcemap;
exports.generateSourcemap = generateSourcemap;
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
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _os() {
  const data = _interopRequireDefault(require("os"));
  _os = function () {
    return data;
  };
  return data;
}
function _ip() {
  const data = _interopRequireDefault(require("ip"));
  _ip = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function getTempFilePath(filename) {
  return _path().default.join(_os().default.tmpdir(), filename);
}
function writeJsonSync(targetPath, data) {
  let json;
  try {
    json = JSON.stringify(data);
  } catch (e) {
    throw new (_cliTools().CLIError)(`Failed to serialize data to json before writing to ${targetPath}`, e);
  }
  try {
    _fs().default.writeFileSync(targetPath, json, 'utf-8');
  } catch (e) {
    throw new (_cliTools().CLIError)(`Failed to write json to ${targetPath}`, e);
  }
}
async function getSourcemapFromServer(port, {
  platform,
  dev,
  minify
}) {
  _cliTools().logger.debug('Getting source maps from Metro packager server');
  const IP_ADDRESS = _ip().default.address();
  const requestURL = `http://${IP_ADDRESS}:${port}/index.map?platform=${platform}&dev=${dev}&minify=${minify}`;
  _cliTools().logger.debug(`Downloading from ${requestURL}`);
  try {
    const {
      data
    } = await (0, _cliTools().fetch)(requestURL);
    return data;
  } catch (e) {
    _cliTools().logger.debug(`Failed to fetch source map from "${requestURL}"`);
    return undefined;
  }
}

/**
 * Generate a sourcemap by fetching it from a running metro server
 */
async function generateSourcemap(port, bundleOptions) {
  // Fetch the source map to a temp directory
  const sourceMapPath = getTempFilePath('index.map');
  const sourceMapResult = await getSourcemapFromServer(port, bundleOptions);
  if (sourceMapResult) {
    _cliTools().logger.debug('Using source maps from Metro packager server');
    writeJsonSync(sourceMapPath, sourceMapResult);
    _cliTools().logger.debug(`Successfully obtained the source map and stored it in ${sourceMapPath}`);
    return sourceMapPath;
  } else {
    _cliTools().logger.error('Cannot obtain source maps from Metro packager server');
    return undefined;
  }
}

/**
 *
 * @param ctx
 */
async function findSourcemap(ctx, port, bundleOptions) {
  const intermediateBuildPath = _path().default.join(ctx.root, 'android', 'app', 'build', 'intermediates', 'sourcemaps', 'react', 'debug', 'index.android.bundle.packager.map');
  const generatedBuildPath = _path().default.join(ctx.root, 'android', 'app', 'build', 'generated', 'sourcemaps', 'react', 'debug', 'index.android.bundle.map');
  if (_fs().default.existsSync(generatedBuildPath)) {
    _cliTools().logger.debug(`Getting the source map from ${generateSourcemap}`);
    return generatedBuildPath;
  } else if (_fs().default.existsSync(intermediateBuildPath)) {
    _cliTools().logger.debug(`Getting the source map from ${intermediateBuildPath}`);
    return intermediateBuildPath;
  } else {
    return generateSourcemap(port, bundleOptions);
  }
}

//# sourceMappingURL=sourcemapUtils.ts.map