"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _buildProject = require("./buildProject");
var _buildOptions = require("./buildOptions");
var _getConfiguration = require("./getConfiguration");
var _getXcodeProjectAndDir = require("./getXcodeProjectAndDir");
var _pods = _interopRequireDefault(require("../../tools/pods"));
var _getArchitecture = _interopRequireDefault(require("../../tools/getArchitecture"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

async function buildIOS(_, ctx, args) {
  var _ctx$project$ios;
  const {
    xcodeProject,
    sourceDir
  } = (0, _getXcodeProjectAndDir.getXcodeProjectAndDir)(ctx.project.ios);
  if (((_ctx$project$ios = ctx.project.ios) === null || _ctx$project$ios === void 0 ? void 0 : _ctx$project$ios.automaticPodsInstallation) || args.forcePods) {
    var _ctx$project$ios2, _ctx$project$ios3;
    const isAppRunningNewArchitecture = ((_ctx$project$ios2 = ctx.project.ios) === null || _ctx$project$ios2 === void 0 ? void 0 : _ctx$project$ios2.sourceDir) ? await (0, _getArchitecture.default)((_ctx$project$ios3 = ctx.project.ios) === null || _ctx$project$ios3 === void 0 ? void 0 : _ctx$project$ios3.sourceDir) : undefined;
    await (0, _pods.default)(ctx.root, ctx.dependencies, {
      forceInstall: args.forcePods,
      newArchEnabled: isAppRunningNewArchitecture
    });
  }
  process.chdir(sourceDir);
  const {
    scheme,
    mode
  } = await (0, _getConfiguration.getConfiguration)(xcodeProject, sourceDir, args);
  return (0, _buildProject.buildProject)(xcodeProject, undefined, mode, scheme, args);
}
var _default = {
  name: 'build-ios',
  description: 'builds your app for iOS platform',
  func: buildIOS,
  examples: [{
    desc: 'Build the app for all iOS devices in Release mode',
    cmd: 'npx react-native build-ios --mode "Release"'
  }],
  options: _buildOptions.buildOptions
};
exports.default = _default;

//# sourceMappingURL=index.ts.map