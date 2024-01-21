"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getDefaultMetroResolver = getDefaultMetroResolver;
exports.withMetroResolvers = withMetroResolvers;
exports.withMetroMutatedResolverContext = withMetroMutatedResolverContext;
exports.withMetroErrorReportingResolver = withMetroErrorReportingResolver;
var _chalk = _interopRequireDefault(require("chalk"));
var metroResolver = _interopRequireWildcard(require("metro-resolver"));
var _path = _interopRequireDefault(require("path"));
var _metroErrors = require("./metroErrors");
var _env = require("../../../utils/env");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    } else {
        var newObj = {};
        if (obj != null) {
            for(var key in obj){
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};
                    if (desc.get || desc.set) {
                        Object.defineProperty(newObj, key, desc);
                    } else {
                        newObj[key] = obj[key];
                    }
                }
            }
        }
        newObj.default = obj;
        return newObj;
    }
}
const debug = require("debug")("expo:metro:withMetroResolvers");
function getDefaultMetroResolver(projectRoot) {
    return (context, moduleName, platform)=>{
        return metroResolver.resolve(context, moduleName, platform);
    };
}
function optionsKeyForContext(context) {
    const canonicalize = require("metro-core/src/canonicalize");
    var _customResolverOptions, ref;
    // Compound key for the resolver cache
    return (ref = JSON.stringify((_customResolverOptions = context.customResolverOptions) != null ? _customResolverOptions : {}, canonicalize)) != null ? ref : "";
}
function withMetroResolvers(config, resolvers) {
    var ref, ref1;
    debug(`Appending ${resolvers.length} custom resolvers to Metro config. (has custom resolver: ${!!((ref = config.resolver) == null ? void 0 : ref.resolveRequest)})`);
    // const hasUserDefinedResolver = !!config.resolver?.resolveRequest;
    // const defaultResolveRequest = getDefaultMetroResolver(projectRoot);
    const originalResolveRequest = (ref1 = config.resolver) == null ? void 0 : ref1.resolveRequest;
    return {
        ...config,
        resolver: {
            ...config.resolver,
            resolveRequest (context, moduleName1, platform1) {
                const upstreamResolveRequest = context.resolveRequest;
                const universalContext = {
                    ...context,
                    resolveRequest (ctx, moduleName, platform) {
                        for (const resolver of resolvers){
                            try {
                                const res = resolver(ctx, moduleName, platform);
                                if (res) {
                                    return res;
                                }
                            } catch (error) {
                                // If the error is directly related to a resolver not being able to resolve a module, then
                                // we can ignore the error and try the next resolver. Otherwise, we should throw the error.
                                const isResolutionError = (0, _metroErrors).isFailedToResolveNameError(error) || (0, _metroErrors).isFailedToResolvePathError(error);
                                if (!isResolutionError) {
                                    throw error;
                                }
                                debug(`Custom resolver threw: ${error.constructor.name}. (module: ${moduleName}, platform: ${platform})`);
                            }
                        }
                        // If we haven't returned by now, use the original resolver or upstream resolver.
                        return upstreamResolveRequest(ctx, moduleName, platform);
                    }
                };
                // If the user defined a resolver, run it first and depend on the documented
                // chaining logic: https://facebook.github.io/metro/docs/resolution/#resolution-algorithm
                //
                // config.resolver.resolveRequest = (context, moduleName, platform) => {
                //
                //  // Do work...
                //
                //  return context.resolveRequest(context, moduleName, platform);
                // };
                const firstResolver = originalResolveRequest != null ? originalResolveRequest : universalContext.resolveRequest;
                return firstResolver(universalContext, moduleName1, platform1);
            }
        }
    };
}
function withMetroMutatedResolverContext(config, getContext) {
    var ref2;
    const defaultResolveRequest = getDefaultMetroResolver(config.projectRoot);
    const originalResolveRequest = (ref2 = config.resolver) == null ? void 0 : ref2.resolveRequest;
    return {
        ...config,
        resolver: {
            ...config.resolver,
            resolveRequest (context, moduleName, platform) {
                const universalContext = getContext(context, moduleName, platform);
                var ref;
                const firstResolver = (ref = originalResolveRequest != null ? originalResolveRequest : universalContext.resolveRequest) != null ? ref : defaultResolveRequest;
                return firstResolver(universalContext, moduleName, platform);
            }
        }
    };
}
function withMetroErrorReportingResolver(config) {
    var ref4;
    if (!_env.env.EXPO_METRO_UNSTABLE_ERRORS) {
        return config;
    }
    const originalResolveRequest = (ref4 = config.resolver) == null ? void 0 : ref4.resolveRequest;
    function mutateResolutionError(error, context, moduleName, platform) {
        var ref;
        if (!platform) {
            debug("Cannot mutate resolution error");
            return error;
        }
        const mapByOrigin = depGraph.get(optionsKeyForContext(context));
        const mapByPlatform = mapByOrigin == null ? void 0 : mapByOrigin.get(platform);
        if (!mapByPlatform) {
            return error;
        }
        // collect all references inversely using some expensive lookup
        const getReferences = (origin)=>{
            const inverseOrigin = [];
            if (!mapByPlatform) {
                return inverseOrigin;
            }
            for (const [originKey, mapByTarget] of mapByPlatform){
                // search comparing origin to path
                const found = [
                    ...mapByTarget.values()
                ].find((resolution)=>resolution.path === origin
                );
                if (found) {
                    inverseOrigin.push({
                        origin,
                        previous: originKey,
                        request: found.request
                    });
                }
            }
            return inverseOrigin;
        };
        const pad = (num)=>{
            return new Array(num).fill(" ").join("");
        };
        var ref3;
        const root = (ref3 = (ref = config.server) == null ? void 0 : ref.unstable_serverRoot) != null ? ref3 : config.projectRoot;
        const recurseBackWithLimit = (req, limit, count = 0)=>{
            const results = {
                origin: req.origin,
                request: req.request,
                previous: []
            };
            if (count >= limit) {
                return results;
            }
            const inverse = getReferences(req.origin);
            for (const match of inverse){
                // Use more qualified name if possible
                // results.origin = match.origin;
                // Found entry point
                if (req.origin === match.previous) {
                    continue;
                }
                results.previous.push(recurseBackWithLimit({
                    origin: match.previous,
                    request: match.request
                }, limit, count + 1));
            }
            return results;
        };
        const inverseTree = recurseBackWithLimit({
            origin: context.originModulePath,
            request: moduleName
        }, // TODO: Do we need to expose this?
        35);
        if (inverseTree.previous.length > 0) {
            debug("Found inverse graph:", JSON.stringify(inverseTree, null, 2));
            let extraMessage = _chalk.default.bold("Import stack:");
            const printRecursive = (tree, depth = 0)=>{
                let filename = _path.default.relative(root, tree.origin);
                if (filename.match(/\?ctx=[\w\d]+$/)) {
                    filename = filename.replace(/\?ctx=[\w\d]+$/, _chalk.default.dim(" (require.context)"));
                } else {
                    let formattedRequest = _chalk.default.green(`"${tree.request}"`);
                    if (// If bundling for web and the import is pulling internals from outside of react-native
                    // then mark it as an invalid import.
                    platform === "web" && !/^(node_modules\/)?react-native\//.test(filename) && tree.request.match(/^react-native\/.*/)) {
                        formattedRequest = formattedRequest + _chalk.default`\n          {yellow Importing react-native internals is not supported on web.}`;
                    }
                    filename = filename + _chalk.default`\n{gray  |} {cyan import} ${formattedRequest}\n`;
                }
                let line = "\n" + pad(depth) + _chalk.default.gray(" ") + filename;
                if (filename.match(/node_modules/)) {
                    line = _chalk.default.gray(// Bold the node module name
                    line.replace(/node_modules\/([^/]+)/, (_match, p1)=>{
                        return "node_modules/" + _chalk.default.bold(p1);
                    }));
                }
                extraMessage += line;
                for (const child of tree.previous){
                    printRecursive(child, // Only add depth if there are multiple children
                    tree.previous.length > 1 ? depth + 1 : depth);
                }
            };
            printRecursive(inverseTree);
            // @ts-expect-error
            error._expoImportStack = extraMessage;
        } else {
            debug("Found no inverse tree for:", context.originModulePath);
        }
        return error;
    }
    const depGraph = new Map();
    return {
        ...config,
        resolver: {
            ...config.resolver,
            resolveRequest (context, moduleName, platform) {
                const storeResult = (res)=>{
                    if (!platform) return;
                    const key = optionsKeyForContext(context);
                    if (!depGraph.has(key)) depGraph.set(key, new Map());
                    const mapByTarget = depGraph.get(key);
                    if (!mapByTarget.has(platform)) mapByTarget.set(platform, new Map());
                    const mapByPlatform = mapByTarget.get(platform);
                    if (!mapByPlatform.has(context.originModulePath)) mapByPlatform.set(context.originModulePath, new Set());
                    const setForModule = mapByPlatform.get(context.originModulePath);
                    const qualifiedModuleName = (res == null ? void 0 : res.type) === "sourceFile" ? res.filePath : moduleName;
                    setForModule.add({
                        path: qualifiedModuleName,
                        request: moduleName
                    });
                };
                // If the user defined a resolver, run it first and depend on the documented
                // chaining logic: https://facebook.github.io/metro/docs/resolution/#resolution-algorithm
                //
                // config.resolver.resolveRequest = (context, moduleName, platform) => {
                //
                //  // Do work...
                //
                //  return context.resolveRequest(context, moduleName, platform);
                // };
                try {
                    const firstResolver = originalResolveRequest != null ? originalResolveRequest : context.resolveRequest;
                    const res = firstResolver(context, moduleName, platform);
                    storeResult(res);
                    return res;
                } catch (error) {
                    throw mutateResolutionError(error, context, moduleName, platform);
                }
            }
        }
    };
}

//# sourceMappingURL=withMetroResolvers.js.map