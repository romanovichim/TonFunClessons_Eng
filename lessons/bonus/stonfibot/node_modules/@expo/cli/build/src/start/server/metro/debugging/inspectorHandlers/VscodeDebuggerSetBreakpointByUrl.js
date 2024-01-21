"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
var _utils = require("./utils");
class VscodeDebuggerSetBreakpointByUrlHandler {
    onDebuggerMessage(message, { userAgent  }) {
        if ((0, _utils).getDebuggerType(userAgent) === "vscode" && message.method === "Debugger.setBreakpointByUrl" && message.params.urlRegex) {
            // Explicitly force the breakpoint to be unbounded
            message.params.url = "file://__invalid_url__";
            delete message.params.urlRegex;
        }
        return false;
    }
}
exports.VscodeDebuggerSetBreakpointByUrlHandler = VscodeDebuggerSetBreakpointByUrlHandler;

//# sourceMappingURL=VscodeDebuggerSetBreakpointByUrl.js.map