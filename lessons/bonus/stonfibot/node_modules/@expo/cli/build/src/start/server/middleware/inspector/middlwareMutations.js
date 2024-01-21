"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.prependMiddleware = prependMiddleware;
exports.replaceMiddlewareWith = replaceMiddlewareWith;
function prependMiddleware(app, middleware) {
    app.use(middleware);
    app.stack.unshift(app.stack.pop());
}
function replaceMiddlewareWith(app, sourceMiddleware, targetMiddleware) {
    const item = app.stack.find((middleware)=>middleware.handle === sourceMiddleware
    );
    if (item) {
        item.handle = targetMiddleware;
    }
}

//# sourceMappingURL=middlwareMutations.js.map