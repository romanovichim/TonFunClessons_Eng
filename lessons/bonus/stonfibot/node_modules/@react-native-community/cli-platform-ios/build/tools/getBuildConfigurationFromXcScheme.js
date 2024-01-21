"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBuildConfigurationFromXcScheme = getBuildConfigurationFromXcScheme;
function _cliTools() {
  const data = require("@react-native-community/cli-tools");
  _cliTools = function () {
    return data;
  };
  return data;
}
function _chalk() {
  const data = _interopRequireDefault(require("chalk"));
  _chalk = function () {
    return data;
  };
  return data;
}
function _fastXmlParser() {
  const data = require("fast-xml-parser");
  _fastXmlParser = function () {
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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const xmlParser = new (_fastXmlParser().XMLParser)({
  ignoreAttributes: false
});
function getBuildConfigurationFromXcScheme(scheme, configuration, sourceDir, projectInfo) {
  try {
    const xcProject = _fs().default.readdirSync(sourceDir).find(dir => dir.includes('.xcodeproj'));
    if (xcProject) {
      const xmlScheme = _fs().default.readFileSync(_path().default.join(sourceDir, xcProject, 'xcshareddata', 'xcschemes', `${scheme}.xcscheme`), {
        encoding: 'utf-8'
      });
      const {
        Scheme
      } = xmlParser.parse(xmlScheme);
      return Scheme.LaunchAction['@_buildConfiguration'];
    }
  } catch {
    const availableSchemas = projectInfo && projectInfo.schemes && projectInfo.schemes.length > 0 ? `Available schemas are: ${projectInfo.schemes.map(name => _chalk().default.bold(name)).join(', ')}'` : '';
    throw new (_cliTools().CLIError)(`Could not find scheme ${scheme}. Please make sure the schema you want to run exists. ${availableSchemas}`);
  }
  return configuration;
}

//# sourceMappingURL=getBuildConfigurationFromXcScheme.ts.map