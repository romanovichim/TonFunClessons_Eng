"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
var _resolvePlatform = require("./resolvePlatform");
class HistoryFallbackMiddleware {
    constructor(indexMiddleware){
        this.indexMiddleware = indexMiddleware;
    }
    getHandler() {
        return (req, res, next)=>{
            const platform = (0, _resolvePlatform).parsePlatformHeader(req);
            if (!platform || platform === "web") {
                // Redirect unknown to the manifest handler while preserving the path.
                // This implements the HTML5 history fallback API.
                return this.indexMiddleware(req, res, next);
            }
            return next();
        };
    }
}
exports.HistoryFallbackMiddleware = HistoryFallbackMiddleware;

//# sourceMappingURL=HistoryFallbackMiddleware.js.map