"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
var _utils = require("./utils");
class VscodeRuntimeGetPropertiesHandler {
    /** Keep track of `Runtime.getProperties` responses to intercept, by request id */ interceptGetProperties = new Set();
    onDebuggerMessage(message, { userAgent  }) {
        if ((0, _utils).getDebuggerType(userAgent) === "vscode" && message.method === "Runtime.getProperties") {
            this.interceptGetProperties.add(message.id);
        }
        // Do not block propagation of this message
        return false;
    }
    onDeviceMessage(message, { userAgent  }) {
        if ((0, _utils).getDebuggerType(userAgent) === "vscode" && "id" in message && this.interceptGetProperties.has(message.id)) {
            this.interceptGetProperties.delete(message.id);
            var _result;
            for (const item of (_result = message.result.result) != null ? _result : []){
                var ref;
                // Force-fully format the properties description to be an empty string
                if (item.value) {
                    var _description;
                    item.value.description = (_description = item.value.description) != null ? _description : "";
                }
                // Avoid passing the `objectId` for symbol types.
                // When collapsing in vscode, it will fetch information about the symbol using the `objectId`.
                // The `Runtime.getProperties` request of the symbol hard-crashes Hermes.
                if (((ref = item.value) == null ? void 0 : ref.type) === "symbol" && item.value.objectId) {
                    delete item.value.objectId;
                }
            }
        }
        // Do not block propagation of this message
        return false;
    }
}
exports.VscodeRuntimeGetPropertiesHandler = VscodeRuntimeGetPropertiesHandler;

//# sourceMappingURL=VscodeRuntimeGetProperties.js.map