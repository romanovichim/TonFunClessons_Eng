"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.createJsInspectorMiddleware = createJsInspectorMiddleware;
var _chalk = _interopRequireDefault(require("chalk"));
var _net = _interopRequireDefault(require("net"));
var _tls = require("tls");
var _url = require("url");
var _jsInspector = require("./JsInspector");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function createJsInspectorMiddleware() {
    return async function(req, res, next) {
        var _url1;
        const { origin , searchParams  } = new _url.URL((_url1 = req.url) != null ? _url1 : "/", getServerBase(req));
        const appId = searchParams.get("appId") || searchParams.get("applicationId");
        if (!appId) {
            res.writeHead(400).end('Missing application identifier ("?appId=...")');
            return;
        }
        const app = await (0, _jsInspector).queryInspectorAppAsync(origin, appId);
        if (!app) {
            res.writeHead(404).end("Unable to find inspector target from @react-native/dev-middleware");
            console.warn(_chalk.default.yellow("No compatible apps connected. JavaScript Debugging can only be used with the Hermes engine."));
            return;
        }
        if (req.method === "GET") {
            const data = JSON.stringify(app);
            res.writeHead(200, {
                "Content-Type": "application/json; charset=UTF-8",
                "Cache-Control": "no-cache",
                "Content-Length": data.length.toString()
            });
            res.end(data);
        } else if (req.method === "POST" || req.method === "PUT") {
            try {
                await (0, _jsInspector).openJsInspector(origin, app);
            } catch (error) {
                var ref;
                // abort(Error: Command failed: osascript -e POSIX path of (path to application "google chrome")
                // 15:50: execution error: Google Chrome got an error: Application isn’t running. (-600)
                console.error(_chalk.default.red("Error launching JS inspector: " + ((ref = error == null ? void 0 : error.message) != null ? ref : "Unknown error occurred")));
                res.writeHead(500);
                res.end();
                return;
            }
            res.end();
        } else {
            res.writeHead(405);
        }
    };
}
function getServerBase(req) {
    const scheme = req.socket instanceof _tls.TLSSocket && req.socket.encrypted === true ? "https" : "http";
    const { localAddress , localPort  } = req.socket;
    const address = localAddress && _net.default.isIPv6(localAddress) ? `[${localAddress}]` : localAddress;
    return `${scheme}:${address}:${localPort}`;
}

//# sourceMappingURL=createJsInspectorMiddleware.js.map