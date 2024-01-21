"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getNodeExternalModuleId = getNodeExternalModuleId;
exports.setupShimFiles = setupShimFiles;
exports.setupNodeExternals = setupNodeExternals;
exports.isNodeExternal = isNodeExternal;
exports.METRO_SHIMS_FOLDER = exports.METRO_EXTERNALS_FOLDER = exports.EXTERNAL_REQUIRE_NATIVE_POLYFILL = exports.EXTERNAL_REQUIRE_POLYFILL = exports.NODE_STDLIB_MODULES = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _module = require("module");
var _path = _interopRequireDefault(require("path"));
var _dir = require("../../../utils/dir");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const NODE_STDLIB_MODULES = [
    "fs/promises",
    ...(_module.builtinModules || // @ts-expect-error
    (process.binding ? Object.keys(process.binding("natives")) : []) || []).filter((x)=>!/^_|^(internal|v8|node-inspect)\/|\//.test(x) && ![
            "sys"
        ].includes(x)
    ), 
].sort();
exports.NODE_STDLIB_MODULES = NODE_STDLIB_MODULES;
const EXTERNAL_REQUIRE_POLYFILL = ".expo/metro/polyfill.js";
exports.EXTERNAL_REQUIRE_POLYFILL = EXTERNAL_REQUIRE_POLYFILL;
const EXTERNAL_REQUIRE_NATIVE_POLYFILL = ".expo/metro/polyfill.native.js";
exports.EXTERNAL_REQUIRE_NATIVE_POLYFILL = EXTERNAL_REQUIRE_NATIVE_POLYFILL;
const METRO_EXTERNALS_FOLDER = ".expo/metro/externals";
exports.METRO_EXTERNALS_FOLDER = METRO_EXTERNALS_FOLDER;
const METRO_SHIMS_FOLDER = ".expo/metro/shims";
exports.METRO_SHIMS_FOLDER = METRO_SHIMS_FOLDER;
function getNodeExternalModuleId(fromModule, moduleId) {
    return _path.default.relative(_path.default.dirname(fromModule), _path.default.join(METRO_EXTERNALS_FOLDER, moduleId, "index.js"));
}
async function setupShimFiles(projectRoot) {
    await _fs.default.promises.mkdir(_path.default.join(projectRoot, METRO_SHIMS_FOLDER), {
        recursive: true
    });
    // Copy the shims to the project folder in case we're running in a monorepo.
    const shimsFolder = _path.default.join(require.resolve("@expo/cli/package.json"), "../static/shims");
    await (0, _dir).copyAsync(shimsFolder, _path.default.join(projectRoot, METRO_SHIMS_FOLDER), {
        overwrite: false,
        recursive: true
    });
}
async function setupNodeExternals(projectRoot) {
    await tapExternalRequirePolyfill(projectRoot);
    await tapNodeShims(projectRoot);
}
async function tapExternalRequirePolyfill(projectRoot) {
    await _fs.default.promises.mkdir(_path.default.join(projectRoot, _path.default.dirname(EXTERNAL_REQUIRE_POLYFILL)), {
        recursive: true
    });
    await writeIfDifferentAsync(_path.default.join(projectRoot, EXTERNAL_REQUIRE_POLYFILL), 'global.$$require_external = typeof window === "undefined" ? require : () => null;');
    await writeIfDifferentAsync(_path.default.join(projectRoot, EXTERNAL_REQUIRE_NATIVE_POLYFILL), "global.$$require_external = (moduleId) => {throw new Error(`Node.js standard library module ${moduleId} is not available in this JavaScript environment`);}");
}
async function writeIfDifferentAsync(filePath, contents) {
    if (_fs.default.existsSync(filePath)) {
        const current = await _fs.default.promises.readFile(filePath, "utf8");
        if (current === contents) return;
    }
    await _fs.default.promises.writeFile(filePath, contents);
}
function isNodeExternal(moduleName) {
    const moduleId = moduleName.replace(/^node:/, "");
    if (NODE_STDLIB_MODULES.includes(moduleId)) {
        return moduleId;
    }
    return null;
}
function tapNodeShimContents(moduleId) {
    return `module.exports = $$require_external('node:${moduleId}');`;
}
// Ensure Node.js shims which require using `$$require_external` are available inside the project.
async function tapNodeShims(projectRoot) {
    const externals = {};
    for (const moduleId of NODE_STDLIB_MODULES){
        const shimDir = _path.default.join(projectRoot, METRO_EXTERNALS_FOLDER, moduleId);
        const shimPath = _path.default.join(shimDir, "index.js");
        externals[moduleId] = shimPath;
        if (!_fs.default.existsSync(shimPath)) {
            await _fs.default.promises.mkdir(shimDir, {
                recursive: true
            });
            await _fs.default.promises.writeFile(shimPath, tapNodeShimContents(moduleId));
        }
    }
}

//# sourceMappingURL=externals.js.map