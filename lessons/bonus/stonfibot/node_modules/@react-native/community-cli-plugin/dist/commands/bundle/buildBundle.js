"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.unstable_buildBundleWithConfig = exports.default = void 0;
var _Server = _interopRequireDefault(require("metro/src/Server"));
var _bundle = _interopRequireDefault(require("metro/src/shared/output/bundle"));
var _RamBundle = _interopRequireDefault(
  require("metro/src/shared/output/RamBundle")
);
var _path = _interopRequireDefault(require("path"));
var _chalk = _interopRequireDefault(require("chalk"));
var _saveAssets = _interopRequireDefault(require("./saveAssets"));
var _loadMetroConfig = _interopRequireDefault(
  require("../../utils/loadMetroConfig")
);
var _cliTools = require("@react-native-community/cli-tools");
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

async function buildBundle(_argv, ctx, args, bundleImpl = _bundle.default) {
  const config = await (0, _loadMetroConfig.default)(ctx, {
    maxWorkers: args.maxWorkers,
    resetCache: args.resetCache,
    config: args.config,
  });
  return buildBundleWithConfig(args, config, bundleImpl);
}
async function buildBundleWithConfig(
  args,
  config,
  bundleImpl = _bundle.default
) {
  if (config.resolver.platforms.indexOf(args.platform) === -1) {
    _cliTools.logger.error(
      `Invalid platform ${
        args.platform ? `"${_chalk.default.bold(args.platform)}" ` : ""
      }selected.`
    );
    _cliTools.logger.info(
      `Available platforms are: ${config.resolver.platforms
        .map((x) => `"${_chalk.default.bold(x)}"`)
        .join(
          ", "
        )}. If you are trying to bundle for an out-of-tree platform, it may not be installed.`
    );
    throw new Error("Bundling failed");
  }

  // This is used by a bazillion of npm modules we don't control so we don't
  // have other choice than defining it as an env variable here.
  process.env.NODE_ENV = args.dev ? "development" : "production";
  let sourceMapUrl = args.sourcemapOutput;
  if (sourceMapUrl != null && !args.sourcemapUseAbsolutePath) {
    sourceMapUrl = _path.default.basename(sourceMapUrl);
  }

  // $FlowIgnore[prop-missing]
  const requestOpts = {
    entryFile: args.entryFile,
    sourceMapUrl,
    dev: args.dev,
    minify: args.minify !== undefined ? args.minify : !args.dev,
    platform: args.platform,
    unstable_transformProfile: args.unstableTransformProfile,
  };
  const server = new _Server.default(config);
  try {
    const bundle = await bundleImpl.build(server, requestOpts);

    // $FlowIgnore[class-object-subtyping]
    // $FlowIgnore[incompatible-call]
    // $FlowIgnore[prop-missing]
    // $FlowIgnore[incompatible-exact]
    await bundleImpl.save(bundle, args, _cliTools.logger.info);

    // Save the assets of the bundle
    const outputAssets = await server.getAssets({
      ..._Server.default.DEFAULT_BUNDLE_OPTIONS,
      ...requestOpts,
      bundleType: "todo",
    });

    // When we're done saving bundle output and the assets, we're done.
    return await (0, _saveAssets.default)(
      outputAssets,
      args.platform,
      args.assetsDest,
      args.assetCatalogDest
    );
  } finally {
    server.end();
  }
}

/**
 * UNSTABLE: This function is likely to be relocated and its API changed in
 * the near future. `@react-native/community-cli-plugin` should not be directly
 * depended on by projects or integrators -- this is exported for legacy
 * compatibility.
 *
 * Create a bundle using a pre-loaded Metro config. The config can be
 * re-used for several bundling calls if multiple platforms are being
 * bundled.
 */
const unstable_buildBundleWithConfig = buildBundleWithConfig;
exports.unstable_buildBundleWithConfig = unstable_buildBundleWithConfig;
var _default = buildBundle;
exports.default = _default;
