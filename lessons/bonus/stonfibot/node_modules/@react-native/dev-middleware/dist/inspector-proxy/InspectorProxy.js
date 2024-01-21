"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = void 0;
var _url = _interopRequireDefault(require("url"));
var _ws = _interopRequireDefault(require("ws"));
var _Device = _interopRequireDefault(require("./Device"));
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 * @oncall react_native
 */

const debug = require("debug")("Metro:InspectorProxy");
const WS_DEVICE_URL = "/inspector/device";
const WS_DEBUGGER_URL = "/inspector/debug";
const PAGES_LIST_JSON_URL = "/json";
const PAGES_LIST_JSON_URL_2 = "/json/list";
const PAGES_LIST_JSON_VERSION_URL = "/json/version";
const INTERNAL_ERROR_CODE = 1011;
/**
 * Main Inspector Proxy class that connects JavaScript VM inside Android/iOS apps and JS debugger.
 */
class InspectorProxy {
  // Root of the project used for relative to absolute source path conversion.

  /** The base URL to the dev server from the developer machine. */

  // Maps device ID to Device instance.

  // Internal counter for device IDs -- just gets incremented for each new device.
  _deviceCounter = 0;
  constructor(projectRoot, serverBaseUrl, eventReporter, experiments) {
    this._projectRoot = projectRoot;
    this._serverBaseUrl = serverBaseUrl;
    this._devices = new Map();
    this._eventReporter = eventReporter;
    this._experiments = experiments;
  }
  getPageDescriptions() {
    // Build list of pages from all devices.
    let result = [];
    Array.from(this._devices.entries()).forEach(([deviceId, device]) => {
      result = result.concat(
        device
          .getPagesList()
          .map((page) => this._buildPageDescription(deviceId, device, page))
      );
    });
    return result;
  }

  // Process HTTP request sent to server. We only respond to 2 HTTP requests:
  // 1. /json/version returns Chrome debugger protocol version that we use
  // 2. /json and /json/list returns list of page descriptions (list of inspectable apps).
  // This list is combined from all the connected devices.
  processRequest(request, response, next) {
    const pathname = _url.default.parse(request.url).pathname;
    if (
      pathname === PAGES_LIST_JSON_URL ||
      pathname === PAGES_LIST_JSON_URL_2
    ) {
      this._sendJsonResponse(response, this.getPageDescriptions());
    } else if (pathname === PAGES_LIST_JSON_VERSION_URL) {
      this._sendJsonResponse(response, {
        Browser: "Mobile JavaScript",
        "Protocol-Version": "1.1",
      });
    } else {
      next();
    }
  }
  createWebSocketListeners() {
    return {
      [WS_DEVICE_URL]: this._createDeviceConnectionWSServer(),
      [WS_DEBUGGER_URL]: this._createDebuggerConnectionWSServer(),
    };
  }

  // Converts page information received from device into PageDescription object
  // that is sent to debugger.
  _buildPageDescription(deviceId, device, page) {
    const { host, protocol } = new URL(this._serverBaseUrl);
    const webSocketScheme = protocol === "https:" ? "wss" : "ws";
    const webSocketUrlWithoutProtocol = `${host}${WS_DEBUGGER_URL}?device=${deviceId}&page=${page.id}`;
    // For now, `/json/list` returns the legacy built-in `devtools://` URL, to
    // preserve existing handling by Flipper. This may return a placeholder in
    // future -- please use the `/open-debugger` endpoint.
    const devtoolsFrontendUrl =
      `devtools://devtools/bundled/js_app.html?experiments=true&v8only=true&${webSocketScheme}=` +
      encodeURIComponent(webSocketUrlWithoutProtocol);
    return {
      id: `${deviceId}-${page.id}`,
      description: page.app,
      title: page.title,
      faviconUrl: "https://reactjs.org/favicon.ico",
      devtoolsFrontendUrl,
      type: "node",
      webSocketDebuggerUrl: `${webSocketScheme}://${webSocketUrlWithoutProtocol}`,
      vm: page.vm,
      deviceName: device.getName(),
    };
  }

  // Sends object as response to HTTP request.
  // Just serializes object using JSON and sets required headers.
  _sendJsonResponse(response, object) {
    const data = JSON.stringify(object, null, 2);
    response.writeHead(200, {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-cache",
      "Content-Length": data.length.toString(),
      Connection: "close",
    });
    response.end(data);
  }

  // Adds websocket handler for device connections.
  // Device connects to /inspector/device and passes device and app names as
  // HTTP GET params.
  // For each new websocket connection we parse device and app names and create
  // new instance of Device class.
  _createDeviceConnectionWSServer() {
    const wss = new _ws.default.Server({
      noServer: true,
      perMessageDeflate: true,
    });
    // $FlowFixMe[value-as-type]
    wss.on("connection", async (socket, req) => {
      try {
        const fallbackDeviceId = String(this._deviceCounter++);
        const query = _url.default.parse(req.url || "", true).query || {};
        const deviceId = query.device || fallbackDeviceId;
        const deviceName = query.name || "Unknown";
        const appName = query.app || "Unknown";
        const oldDevice = this._devices.get(deviceId);
        const newDevice = new _Device.default(
          deviceId,
          deviceName,
          appName,
          socket,
          this._projectRoot,
          this._eventReporter
        );
        if (oldDevice) {
          oldDevice.handleDuplicateDeviceConnection(newDevice);
        }
        this._devices.set(deviceId, newDevice);
        debug(
          `Got new connection: name=${deviceName}, app=${appName}, device=${deviceId}`
        );
        socket.on("close", () => {
          this._devices.delete(deviceId);
          debug(`Device ${deviceName} disconnected.`);
        });
      } catch (e) {
        console.error("error", e);
        socket.close(INTERNAL_ERROR_CODE, e?.toString() ?? "Unknown error");
      }
    });
    return wss;
  }

  // Returns websocket handler for debugger connections.
  // Debugger connects to webSocketDebuggerUrl that we return as part of page description
  // in /json response.
  // When debugger connects we try to parse device and page IDs from the query and pass
  // websocket object to corresponding Device instance.
  _createDebuggerConnectionWSServer() {
    const wss = new _ws.default.Server({
      noServer: true,
      perMessageDeflate: false,
    });
    // $FlowFixMe[value-as-type]
    wss.on("connection", async (socket, req) => {
      try {
        const query = _url.default.parse(req.url || "", true).query || {};
        const deviceId = query.device;
        const pageId = query.page;
        if (deviceId == null || pageId == null) {
          throw new Error("Incorrect URL - must provide device and page IDs");
        }
        const device = this._devices.get(deviceId);
        if (device == null) {
          throw new Error("Unknown device with ID " + deviceId);
        }
        device.handleDebuggerConnection(socket, pageId, {
          userAgent: req.headers["user-agent"] ?? null,
        });
      } catch (e) {
        console.error(e);
        socket.close(INTERNAL_ERROR_CODE, e?.toString() ?? "Unknown error");
        this._eventReporter?.logEvent({
          type: "connect_debugger_frontend",
          status: "error",
          error: e,
        });
      }
    });
    return wss;
  }
}
exports.default = InspectorProxy;
