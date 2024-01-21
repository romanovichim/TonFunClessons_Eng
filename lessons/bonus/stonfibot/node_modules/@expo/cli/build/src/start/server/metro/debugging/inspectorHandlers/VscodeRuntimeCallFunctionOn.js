"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
var _utils = require("./utils");
class VscodeRuntimeCallFunctionOnHandler {
    onDebuggerMessage(message, { socket , userAgent  }) {
        if ((0, _utils).getDebuggerType(userAgent) === "vscode" && message.method === "Runtime.callFunctionOn") {
            return (0, _utils).respond(socket, {
                id: message.id,
                result: {
                    // We don't know the `type` and vscode allows `type: undefined`
                    result: {
                        objectId: message.params.objectId
                    }
                }
            });
        }
        return false;
    }
}
exports.VscodeRuntimeCallFunctionOnHandler = VscodeRuntimeCallFunctionOnHandler;

//# sourceMappingURL=VscodeRuntimeCallFunctionOn.js.map