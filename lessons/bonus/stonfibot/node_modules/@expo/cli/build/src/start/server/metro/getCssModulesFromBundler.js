"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getCssModulesFromBundler = getCssModulesFromBundler;
exports.getFileName = getFileName;
var _crypto = _interopRequireDefault(require("crypto"));
var _js = require("metro/src/DeltaBundler/Serializers/helpers/js");
var _splitBundleOptions = _interopRequireDefault(require("metro/src/lib/splitBundleOptions"));
var _path = _interopRequireDefault(require("path"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
// s = static
const STATIC_EXPORT_DIRECTORY = "_expo/static/css";
async function getCssModulesFromBundler(config, incrementalBundler, options) {
    // Static CSS is a web-only feature.
    if (options.platform !== "web") {
        return [];
    }
    const { entryFile , onProgress , resolverOptions , transformOptions  } = (0, _splitBundleOptions).default(options);
    const dependencies = await incrementalBundler.getDependencies([
        entryFile
    ], transformOptions, resolverOptions, {
        onProgress,
        shallow: false
    });
    var _unstable_serverRoot;
    return getCssModules(dependencies, {
        processModuleFilter: config.serializer.processModuleFilter,
        assetPlugins: config.transformer.assetPlugins,
        platform: transformOptions.platform,
        projectRoot: (_unstable_serverRoot = config.server.unstable_serverRoot) != null ? _unstable_serverRoot : config.projectRoot,
        publicPath: config.transformer.publicPath
    });
}
function hashString(str) {
    return _crypto.default.createHash("md5").update(str).digest("hex");
}
function getCssModules(dependencies, { processModuleFilter , projectRoot  }) {
    const promises = [];
    for (const module of dependencies.values()){
        if ((0, _js).isJsModule(module) && processModuleFilter(module) && (0, _js).getJsOutput(module).type === "js/module" && _path.default.relative(projectRoot, module.path) !== "package.json") {
            const cssMetadata = getCssMetadata(module);
            if (cssMetadata) {
                const contents = cssMetadata.code;
                const filename = _path.default.join(// Consistent location
                STATIC_EXPORT_DIRECTORY, // Hashed file contents + name for caching
                getFileName(module.path) + "-" + hashString(module.path + contents) + ".css");
                promises.push({
                    originFilename: _path.default.relative(projectRoot, module.path),
                    filename,
                    source: contents
                });
            }
        }
    }
    return promises;
}
function getCssMetadata(module) {
    var ref;
    const data = (ref = module.output[0]) == null ? void 0 : ref.data;
    if (data && typeof data === "object" && "css" in data) {
        if (typeof data.css !== "object" || !("code" in data.css)) {
            throw new Error(`Unexpected CSS metadata in Metro module (${module.path}): ${JSON.stringify(data.css)}`);
        }
        return data.css;
    }
    return null;
}
function getFileName(module) {
    return _path.default.basename(module).replace(/\.[^.]+$/, "");
}

//# sourceMappingURL=getCssModulesFromBundler.js.map