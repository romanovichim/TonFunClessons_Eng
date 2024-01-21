"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const debug = require("debug")("expo:start:server:middleware:metro-context-modules");
class ContextModuleSourceMapsMiddleware {
    getHandler() {
        return (req, res, next)=>{
            if (!(req == null ? void 0 : req.url) || req.method !== "GET" && req.method !== "HEAD") {
                return next();
            }
            if (req.url.match(/%3Fctx=[\d\w\W]+\.map\?/)) {
                debug("Skipping sourcemap request for context module %s", req.url);
                // Return a noop response for the sourcemap
                res.writeHead(200, {
                    "Content-Type": "application/json"
                });
                res.end("{}");
                return;
            }
            next();
        };
    }
}
exports.ContextModuleSourceMapsMiddleware = ContextModuleSourceMapsMiddleware;

//# sourceMappingURL=ContextModuleSourceMapsMiddleware.js.map