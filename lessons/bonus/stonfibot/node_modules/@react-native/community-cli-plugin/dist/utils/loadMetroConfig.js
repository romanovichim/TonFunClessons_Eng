"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = loadMetroConfig;
var _path = _interopRequireDefault(require("path"));
var _metroConfig = require("metro-config");
var _cliTools = require("@react-native-community/cli-tools");
var _metroPlatformResolver = require("./metroPlatformResolver");
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 * @oncall react_native
 */

/**
 * Get the config options to override based on RN CLI inputs.
 */
function getOverrideConfig(ctx) {
  const outOfTreePlatforms = Object.keys(ctx.platforms).filter(
    (platform) => ctx.platforms[platform].npmPackageName
  );
  const resolver = {
    platforms: [...Object.keys(ctx.platforms), "native"],
  };
  if (outOfTreePlatforms.length) {
    resolver.resolveRequest = (0,
    _metroPlatformResolver.reactNativePlatformResolver)(
      outOfTreePlatforms.reduce((result, platform) => {
        result[platform] = ctx.platforms[platform].npmPackageName;
        return result;
      }, {})
    );
  }
  return {
    resolver,
    serializer: {
      // We can include multiple copies of InitializeCore here because metro will
      // only add ones that are already part of the bundle
      getModulesRunBeforeMainModule: () => [
        require.resolve(
          _path.default.join(
            ctx.reactNativePath,
            "Libraries/Core/InitializeCore"
          ),
          {
            paths: [ctx.root],
          }
        ),
        ...outOfTreePlatforms.map((platform) =>
          require.resolve(
            `${ctx.platforms[platform].npmPackageName}/Libraries/Core/InitializeCore`
          )
        ),
      ],
    },
  };
}

/**
 * Load Metro config.
 *
 * Allows the CLI to override select values in `metro.config.js` based on
 * dynamic user options in `ctx`.
 */
async function loadMetroConfig(ctx, options = {}) {
  const overrideConfig = getOverrideConfig(ctx);
  const cwd = ctx.root;
  const projectConfig = await (0, _metroConfig.resolveConfig)(
    options.config,
    cwd
  );
  if (projectConfig.isEmpty) {
    throw new _cliTools.CLIError(`No Metro config found in ${cwd}`);
  }
  _cliTools.logger.debug(`Reading Metro config from ${projectConfig.filepath}`);
  if (!global.__REACT_NATIVE_METRO_CONFIG_LOADED) {
    for (const line of `
=================================================================================================
From React Native 0.73, your project's Metro config should extend '@react-native/metro-config'
or it will fail to build. Please copy the template at:
https://github.com/facebook/react-native/blob/main/packages/react-native/template/metro.config.js
This warning will be removed in future (https://github.com/facebook/metro/issues/1018).
=================================================================================================
    `
      .trim()
      .split("\n")) {
      _cliTools.logger.warn(line);
    }
  }
  return (0, _metroConfig.mergeConfig)(
    await (0, _metroConfig.loadConfig)({
      cwd,
      ...options,
    }),
    overrideConfig
  );
}
