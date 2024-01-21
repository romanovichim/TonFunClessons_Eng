"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
var _utils = require("./utils");
class NetworkResponseHandler {
    /** All known responses, mapped by request id */ storage = new Map();
    onDeviceMessage(message) {
        if (message.method === "Expo(Network.receivedResponseBody)") {
            const { requestId , ...requestInfo } = message.params;
            this.storage.set(requestId, requestInfo);
            return true;
        }
        return false;
    }
    onDebuggerMessage(message, { socket  }) {
        if (message.method === "Network.getResponseBody" && this.storage.has(message.params.requestId)) {
            return (0, _utils).respond(socket, {
                id: message.id,
                result: this.storage.get(message.params.requestId)
            });
        }
        return false;
    }
}
exports.NetworkResponseHandler = NetworkResponseHandler;

//# sourceMappingURL=NetworkResponse.js.map