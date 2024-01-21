"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.bundleApiRoute = bundleApiRoute;
exports.invalidateApiRouteCache = invalidateApiRouteCache;
var _metroErrorInterface = require("./metroErrorInterface");
var _getStaticRenderFunctions = require("../getStaticRenderFunctions");
const debug = require("debug")("expo:api-routes");
const pendingRouteOperations = new Map();
async function bundleApiRoute(projectRoot, filepath, options) {
    if (pendingRouteOperations.has(filepath)) {
        return pendingRouteOperations.get(filepath);
    }
    const devServerUrl = `http://localhost:${options.port}`;
    async function bundleAsync() {
        try {
            debug("Bundle API route:", options.routerRoot, filepath);
            const middleware = await (0, _getStaticRenderFunctions).requireFileContentsWithMetro(projectRoot, devServerUrl, filepath, {
                minify: options.mode === "production",
                dev: options.mode !== "production",
                // Ensure Node.js
                environment: "node",
                baseUrl: options.baseUrl,
                routerRoot: options.routerRoot
            });
            return middleware;
        } catch (error) {
            if (error instanceof Error) {
                await (0, _metroErrorInterface).logMetroErrorAsync({
                    error,
                    projectRoot
                });
            }
            if (options.shouldThrow) {
                throw error;
            }
            // TODO: improve error handling, maybe have this be a mock function which returns the static error html
            return null;
        } finally{
        // pendingRouteOperations.delete(filepath);
        }
    }
    const route = bundleAsync();
    pendingRouteOperations.set(filepath, route);
    return route;
}
async function invalidateApiRouteCache() {
    pendingRouteOperations.clear();
}

//# sourceMappingURL=bundleApiRoutes.js.map