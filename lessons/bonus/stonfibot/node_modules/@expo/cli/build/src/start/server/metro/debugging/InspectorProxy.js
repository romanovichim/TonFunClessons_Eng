"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.createInspectorProxyClass = createInspectorProxyClass;
var _url = _interopRequireDefault(require("url"));
var _ws = _interopRequireDefault(require("ws"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const debug = require("debug")("expo:metro:inspector-proxy:proxy");
/** Web socket error code for unknown internal errors */ const INTERNAL_ERROR_CODE = 1011;
function createInspectorProxyClass(MetroInspectorProxyClass, MetroDeviceClass) {
    return class ExpoInspectorProxy extends MetroInspectorProxyClass {
        /**
     * This method is overwritten to inject our own device class.
     * @see https://github.com/facebook/react-native/blob/f1df4ceb8479a6fc9c30f7571f5aeec255b116d2/packages/dev-middleware/src/inspector-proxy/InspectorProxy.js#L179-L227
     */ _createDeviceConnectionWSServer() {
            const wss = new _ws.default.Server({
                noServer: true,
                perMessageDeflate: true,
                // Don't crash on exceptionally large messages - assume the device is
                // well-behaved and the debugger is prepared to handle large messages.
                maxPayload: 0
            });
            wss.on("connection", async (socket, req)=>{
                try {
                    const fallbackDeviceId = String(this._deviceCounter++);
                    const query = _url.default.parse(req.url || "", true).query || {};
                    const deviceId = asString(query.device) || fallbackDeviceId;
                    const deviceName = asString(query.name) || "Unknown";
                    const appName = asString(query.app) || "Unknown";
                    const oldDevice = this._devices.get(deviceId);
                    // FIX: Create a new device instance using our own extended class
                    const newDevice = new MetroDeviceClass(deviceId, deviceName, appName, socket, this._projectRoot, this._eventReporter);
                    if (oldDevice) {
                        oldDevice.handleDuplicateDeviceConnection(newDevice);
                    }
                    this._devices.set(deviceId, newDevice);
                    debug(`Got new connection: name=${deviceName}, app=${appName}, device=${deviceId}`);
                    socket.on("close", ()=>{
                        // FIX: Only clean up the device reference, if not replaced by new device
                        if (this._devices.get(deviceId) === newDevice) {
                            this._devices.delete(deviceId);
                            debug(`Device ${deviceName} disconnected.`);
                        } else {
                            debug(`Device ${deviceName} reconnected.`);
                        }
                    });
                } catch (e) {
                    var // FIX: add missing event reporter
                    ref;
                    console.error("error", e);
                    var ref1;
                    socket.close(INTERNAL_ERROR_CODE, (ref1 = e == null ? void 0 : e.toString()) != null ? ref1 : "Unknown error");
                    (ref = this._eventReporter) == null ? void 0 : ref.logEvent({
                        type: "connect_debugger_app",
                        status: "error",
                        error: e
                    });
                }
            });
            return wss;
        }
        /**
     * This method is overwritten to allow user agents to be passed as query parameter.
     * The built-in debugger in vscode does not add any user agent headers.
     * @see https://github.com/facebook/react-native/blob/f1df4ceb8479a6fc9c30f7571f5aeec255b116d2/packages/dev-middleware/src/inspector-proxy/InspectorProxy.js#L234-L272
     */ _createDebuggerConnectionWSServer() {
            const wss = new _ws.default.Server({
                noServer: true,
                perMessageDeflate: false,
                // Don't crash on exceptionally large messages - assume the debugger is
                // well-behaved and the device is prepared to handle large messages.
                maxPayload: 0
            });
            wss.on("connection", async (socket, req)=>{
                try {
                    const query = _url.default.parse(req.url || "", true).query || {};
                    const deviceId = asString(query.device);
                    const pageId = asString(query.page);
                    // FIX: Determine the user agent from query paramter or header
                    const userAgent = asString(query.userAgent) || req.headers["user-agent"] || null;
                    if (deviceId == null || pageId == null) {
                        throw new Error("Incorrect URL - must provide device and page IDs");
                    }
                    const device = this._devices.get(deviceId);
                    if (device == null) {
                        throw new Error("Unknown device with ID " + deviceId);
                    }
                    device.handleDebuggerConnection(socket, pageId, {
                        userAgent
                    });
                } catch (e) {
                    var ref;
                    console.error(e);
                    var ref2;
                    socket.close(INTERNAL_ERROR_CODE, (ref2 = e == null ? void 0 : e.toString()) != null ? ref2 : "Unknown error");
                    (ref = this._eventReporter) == null ? void 0 : ref.logEvent({
                        type: "connect_debugger_frontend",
                        status: "error",
                        error: e
                    });
                }
            });
            return wss;
        }
    };
}
/** Convert the query paramters to plain string */ function asString(value = "") {
    return Array.isArray(value) ? value.join() : value;
}

//# sourceMappingURL=InspectorProxy.js.map