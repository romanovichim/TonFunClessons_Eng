"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.suppressRemoteDebuggingErrorMiddleware = suppressRemoteDebuggingErrorMiddleware;
function suppressRemoteDebuggingErrorMiddleware(req, res, next) {
    var ref;
    if ((ref = req.url) == null ? void 0 : ref.match(/\/debugger-ui\/.+\.map$/)) {
        res.writeHead(404);
        res.end("Sourcemap for /debugger-ui/ is not supported.");
        return;
    }
    next();
}

//# sourceMappingURL=suppressErrorMiddleware.js.map