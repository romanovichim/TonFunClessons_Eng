"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.fetchManifest = fetchManifest;
exports.inflateManifest = inflateManifest;
var _resolveFrom = _interopRequireDefault(require("resolve-from"));
var _router = require("./router");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function getExpoRouteManifestBuilderAsync(projectRoot) {
    return require((0, _resolveFrom).default(projectRoot, "expo-router/build/routes-manifest")).createRoutesManifest;
}
async function fetchManifest(projectRoot, options) {
    const getManifest = getExpoRouteManifestBuilderAsync(projectRoot);
    const paths = (0, _router).getRoutePaths(options.appDir);
    // Get the serialized manifest
    const jsonManifest = getManifest(paths);
    if (!jsonManifest) {
        return null;
    }
    if (!jsonManifest.htmlRoutes || !jsonManifest.apiRoutes) {
        throw new Error("Routes manifest is malformed: " + JSON.stringify(jsonManifest, null, 2));
    }
    if (!options.asJson) {
        // @ts-expect-error
        return inflateManifest(jsonManifest);
    }
    // @ts-expect-error
    return jsonManifest;
}
function inflateManifest(json) {
    var ref, ref1, ref2;
    return {
        ...json,
        htmlRoutes: (ref = json.htmlRoutes) == null ? void 0 : ref.map((value)=>{
            return {
                ...value,
                namedRegex: new RegExp(value.namedRegex)
            };
        }),
        apiRoutes: (ref1 = json.apiRoutes) == null ? void 0 : ref1.map((value)=>{
            return {
                ...value,
                namedRegex: new RegExp(value.namedRegex)
            };
        }),
        notFoundRoutes: (ref2 = json.notFoundRoutes) == null ? void 0 : ref2.map((value)=>{
            return {
                ...value,
                namedRegex: new RegExp(value.namedRegex)
            };
        })
    };
}

//# sourceMappingURL=fetchRouterManifest.js.map