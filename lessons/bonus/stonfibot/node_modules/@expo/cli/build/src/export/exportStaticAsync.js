"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.unstable_exportStaticAsync = unstable_exportStaticAsync;
exports.getFilesToExportFromServerAsync = getFilesToExportFromServerAsync;
exports.getHtmlFiles = getHtmlFiles;
exports.getPathVariations = getPathVariations;
var _assert = _interopRequireDefault(require("assert"));
var _chalk = _interopRequireDefault(require("chalk"));
var _path = _interopRequireDefault(require("path"));
var _resolveFrom = _interopRequireDefault(require("resolve-from"));
var _util = require("util");
var _favicon = require("./favicon");
var _persistMetroAssets = require("./persistMetroAssets");
var _saveAssets = require("./saveAssets");
var _log = require("../log");
var _devServerManager = require("../start/server/DevServerManager");
var _metroBundlerDevServer = require("../start/server/metro/MetroBundlerDevServer");
var _metroErrorInterface = require("../start/server/metro/metroErrorInterface");
var _router = require("../start/server/metro/router");
var _serializeHtml = require("../start/server/metro/serializeHtml");
var _link = require("../utils/link");
var _port = require("../utils/port");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const debug = require("debug")("expo:export:generateStaticRoutes");
async function unstable_exportStaticAsync(projectRoot, options) {
    _log.Log.log(`Static rendering is enabled. ` + (0, _link).learnMore("https://docs.expo.dev/router/reference/static-rendering/"));
    // Useful for running parallel e2e tests in CI.
    const port = await (0, _port).getFreePortAsync(8082);
    // TODO: Prevent starting the watcher.
    const devServerManager = new _devServerManager.DevServerManager(projectRoot, {
        minify: options.minify,
        mode: "production",
        port,
        location: {},
        resetDevServer: options.clear,
        maxWorkers: options.maxWorkers
    });
    await devServerManager.startAsync([
        {
            type: "metro",
            options: {
                port,
                location: {},
                isExporting: true,
                resetDevServer: options.clear,
                maxWorkers: options.maxWorkers
            }
        }, 
    ]);
    try {
        return await exportFromServerAsync(projectRoot, devServerManager, options);
    } finally{
        await devServerManager.stopAsync();
    }
}
/** Match `(page)` -> `page` */ function matchGroupName(name) {
    var ref;
    return (ref = name.match(/^\(([^/]+?)\)$/)) == null ? void 0 : ref[1];
}
async function getFilesToExportFromServerAsync(projectRoot, { manifest , renderAsync , // Servers can handle group routes automatically and therefore
// don't require the build-time generation of every possible group
// variation.
exportServer , // name : contents
files =new Map()  }) {
    await Promise.all(getHtmlFiles({
        manifest,
        includeGroupVariations: !exportServer
    }).map(async ({ route , filePath , pathname  })=>{
        try {
            const targetDomain = exportServer ? "server" : "client";
            files.set(filePath, {
                contents: "",
                targetDomain
            });
            const data = await renderAsync({
                route,
                filePath,
                pathname
            });
            files.set(filePath, {
                contents: data,
                routeId: pathname,
                targetDomain
            });
        } catch (e) {
            await (0, _metroErrorInterface).logMetroErrorAsync({
                error: e,
                projectRoot
            });
            throw new Error("Failed to statically export route: " + pathname);
        }
    }));
    return files;
}
function modifyRouteNodeInRuntimeManifest(manifest, callback) {
    const iterateScreens = (screens)=>{
        Object.values(screens).map((value)=>{
            if (typeof value !== "string") {
                if (value._route) callback(value._route);
                iterateScreens(value.screens);
            }
        });
    };
    iterateScreens(manifest.screens);
}
// TODO: Do this earlier in the process.
function makeRuntimeEntryPointsAbsolute(manifest, appDir) {
    modifyRouteNodeInRuntimeManifest(manifest, (route)=>{
        if (Array.isArray(route.entryPoints)) {
            route.entryPoints = route.entryPoints.map((entryPoint)=>{
                if (entryPoint.startsWith(".")) {
                    return _path.default.resolve(appDir, entryPoint);
                } else if (!_path.default.isAbsolute(entryPoint)) {
                    return (0, _resolveFrom).default(appDir, entryPoint);
                }
                return entryPoint;
            });
        }
    });
}
/** Perform all fs commits */ async function exportFromServerAsync(projectRoot, devServerManager, { outputDir , baseUrl , exportServer , minify , includeSourceMaps , routerRoot , asyncRoutes , files =new Map()  }) {
    const appDir = _path.default.join(projectRoot, routerRoot);
    const injectFaviconTag = await (0, _favicon).getVirtualFaviconAssetsAsync(projectRoot, {
        outputDir,
        baseUrl,
        files
    });
    const devServer = devServerManager.getDefaultDevServer();
    (0, _assert).default(devServer instanceof _metroBundlerDevServer.MetroBundlerDevServer);
    const [resources, { manifest , serverManifest , renderAsync  }] = await Promise.all([
        devServer.getStaticResourcesAsync({
            isExporting: true,
            mode: "production",
            minify,
            includeSourceMaps,
            baseUrl,
            asyncRoutes,
            routerRoot
        }),
        devServer.getStaticRenderFunctionAsync({
            mode: "production",
            minify,
            baseUrl,
            routerRoot
        }), 
    ]);
    makeRuntimeEntryPointsAbsolute(manifest, appDir);
    debug("Routes:\n", (0, _util).inspect(manifest, {
        colors: true,
        depth: null
    }));
    await getFilesToExportFromServerAsync(projectRoot, {
        files,
        manifest,
        exportServer,
        async renderAsync ({ pathname , route  }) {
            const template = await renderAsync(pathname);
            let html = await (0, _serializeHtml).serializeHtmlWithAssets({
                mode: "production",
                resources: resources.artifacts,
                template,
                baseUrl,
                route
            });
            if (injectFaviconTag) {
                html = injectFaviconTag(html);
            }
            return html;
        }
    });
    (0, _saveAssets).getFilesFromSerialAssets(resources.artifacts, {
        platform: "web",
        includeSourceMaps,
        files
    });
    if (resources.assets) {
        // TODO: Collect files without writing to disk.
        // NOTE(kitten): Re. above, this is now using `files` except for iOS catalog output, which isn't used here
        await (0, _persistMetroAssets).persistMetroAssetsAsync(resources.assets, {
            files,
            platform: "web",
            outputDirectory: outputDir,
            baseUrl
        });
    }
    if (exportServer) {
        const apiRoutes = await exportApiRoutesAsync({
            outputDir,
            server: devServer,
            routerRoot,
            manifest: serverManifest,
            baseUrl
        });
        // Add the api routes to the files to export.
        for (const [route, contents] of apiRoutes){
            files.set(route, contents);
        }
    } else {
        warnPossibleInvalidExportType(appDir);
    }
    return files;
}
function getHtmlFiles({ manifest , includeGroupVariations  }) {
    const htmlFiles = new Set();
    function traverseScreens(screens, route, baseUrl = "") {
        for (const value of Object.values(screens)){
            let leaf = null;
            if (typeof value === "string") {
                leaf = value;
            } else if (Object.keys(value.screens).length === 0) {
                leaf = value.path;
                var __route;
                route = (__route = value._route) != null ? __route : null;
            }
            if (leaf != null) {
                let filePath = baseUrl + leaf;
                if (leaf === "") {
                    filePath = baseUrl === "" ? "index" : baseUrl.endsWith("/") ? baseUrl + "index" : baseUrl.slice(0, -1);
                }
                // This should never happen, the type of `string | object` originally comes from React Navigation.
                if (!route) {
                    throw new Error(`Internal error: Route not found for "${filePath}" while collecting static export paths.`);
                }
                if (includeGroupVariations) {
                    // TODO: Dedupe requests for alias routes.
                    addOptionalGroups(filePath, route);
                } else {
                    htmlFiles.add({
                        filePath,
                        route
                    });
                }
            } else if (typeof value === "object" && (value == null ? void 0 : value.screens)) {
                const newPath = baseUrl + value.path + "/";
                var __route1;
                traverseScreens(value.screens, (__route1 = value._route) != null ? __route1 : null, newPath);
            }
        }
    }
    function addOptionalGroups(path, route) {
        const variations = getPathVariations(path);
        for (const variation of variations){
            htmlFiles.add({
                filePath: variation,
                route
            });
        }
    }
    traverseScreens(manifest.screens, null);
    return uniqueBy(Array.from(htmlFiles), (value)=>value.filePath
    ).map((value)=>{
        const parts = value.filePath.split("/");
        // Replace `:foo` with `[foo]` and `*foo` with `[...foo]`
        const partsWithGroups = parts.map((part)=>{
            if (part === "*not-found") {
                return `+not-found`;
            } else if (part.startsWith(":")) {
                return `[${part.slice(1)}]`;
            } else if (part.startsWith("*")) {
                return `[...${part.slice(1)}]`;
            }
            return part;
        });
        const filePathLocation = partsWithGroups.join("/");
        const filePath = filePathLocation + ".html";
        return {
            ...value,
            filePath,
            pathname: filePathLocation.replace(/(\/?index)?$/, "")
        };
    });
}
function uniqueBy(array, key) {
    const seen = new Set();
    const result = [];
    for (const value of array){
        const id = key(value);
        if (!seen.has(id)) {
            seen.add(id);
            result.push(value);
        }
    }
    return result;
}
function getPathVariations(routePath) {
    const variations = new Set();
    const segments1 = routePath.split("/");
    function generateVariations(segments, current = "") {
        if (segments.length === 0) {
            if (current) variations.add(current);
            return;
        }
        const [head, ...rest] = segments;
        if (matchGroupName(head)) {
            const groups = head.slice(1, -1).split(",");
            if (groups.length > 1) {
                for (const group of groups){
                    // If there are multiple groups, recurse on each group.
                    generateVariations([
                        `(${group.trim()})`,
                        ...rest
                    ], current);
                }
                return;
            } else {
                // Start a fork where this group is included
                generateVariations(rest, current ? `${current}/(${groups[0]})` : `(${groups[0]})`);
            // This code will continue and add paths without this group included`
            }
        } else if (current) {
            current = `${current}/${head}`;
        } else {
            current = head;
        }
        generateVariations(rest, current);
    }
    generateVariations(segments1);
    return Array.from(variations);
}
async function exportApiRoutesAsync({ outputDir , server , routerRoot , baseUrl , ...props }) {
    const { manifest , files  } = await server.exportExpoRouterApiRoutesAsync({
        mode: "production",
        routerRoot,
        outputDir: "_expo/functions",
        prerenderManifest: props.manifest,
        baseUrl
    });
    _log.Log.log(_chalk.default.bold`Exporting ${files.size} API Routes.`);
    files.set("_expo/routes.json", {
        contents: JSON.stringify(manifest, null, 2),
        targetDomain: "server"
    });
    return files;
}
function warnPossibleInvalidExportType(appDir) {
    const apiRoutes = (0, _router).getApiRoutesForDirectory(appDir);
    if (apiRoutes.length) {
        // TODO: Allow API Routes for native-only.
        _log.Log.warn(_chalk.default.yellow`Skipping export for API routes because \`web.output\` is not "server". You may want to remove the routes: ${apiRoutes.map((v)=>_path.default.relative(appDir, v)
        ).join(", ")}`);
    }
}

//# sourceMappingURL=exportStaticAsync.js.map