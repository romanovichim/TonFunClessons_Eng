"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.runServer = void 0;
var _assert = _interopRequireDefault(require("assert"));
var _http = _interopRequireDefault(require("http"));
var _https = _interopRequireDefault(require("https"));
var _metro = _interopRequireDefault(require("metro"));
var _hmrServer = _interopRequireDefault(require("metro/src/HmrServer"));
var _createWebsocketServer = _interopRequireDefault(require("metro/src/lib/createWebsocketServer"));
var _url = require("url");
var _log = require("../../../log");
var _getRunningProcess = require("../../../utils/getRunningProcess");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const runServer = async (metroBundler, config, { hasReducedPerformance =false , host , onError , onReady , secureServerOptions , waitForBundler =false , websocketEndpoints ={} , watch  })=>{
    // await earlyPortCheck(host, config.server.port);
    // if (secure != null || secureCert != null || secureKey != null) {
    //   // eslint-disable-next-line no-console
    //   console.warn(
    //     chalk.inverse.yellow.bold(' DEPRECATED '),
    //     'The `secure`, `secureCert`, and `secureKey` options are now deprecated. ' +
    //       'Please use the `secureServerOptions` object instead to pass options to ' +
    //       "Metro's https development server.",
    //   );
    // }
    const { middleware , end , metroServer  } = await _metro.default.createConnectMiddleware(config, {
        hasReducedPerformance,
        waitForBundler,
        watch
    });
    (0, _assert).default(typeof middleware.use === "function");
    const serverApp = middleware;
    let httpServer;
    if (secureServerOptions != null) {
        httpServer = _https.default.createServer(secureServerOptions, serverApp);
    } else {
        httpServer = _http.default.createServer(serverApp);
    }
    return new Promise((resolve, reject)=>{
        httpServer.on("error", (error)=>{
            if ("code" in error && error.code === "EADDRINUSE") {
                // If `Error: listen EADDRINUSE: address already in use :::8081` then print additional info
                // about the process before throwing.
                const info = (0, _getRunningProcess).getRunningProcess(config.server.port);
                if (info) {
                    _log.Log.error(`Port ${config.server.port} is busy running ${info.command} in: ${info.directory}`);
                }
            }
            if (onError) {
                onError(error);
            }
            reject(error);
            end();
        });
        httpServer.listen(config.server.port, host, ()=>{
            if (onReady) {
                onReady(httpServer);
            }
            Object.assign(websocketEndpoints, {
                // @ts-expect-error: incorrect types
                "/hot": (0, _createWebsocketServer).default({
                    websocketServer: new _hmrServer.default(metroServer.getBundler(), metroServer.getCreateModuleId(), config)
                })
            });
            httpServer.on("upgrade", (request, socket, head)=>{
                const { pathname  } = (0, _url).parse(request.url);
                if (pathname != null && websocketEndpoints[pathname]) {
                    websocketEndpoints[pathname].handleUpgrade(request, socket, head, (ws)=>{
                        websocketEndpoints[pathname].emit("connection", ws, request);
                    });
                } else {
                    socket.destroy();
                }
            });
            resolve({
                server: httpServer,
                metro: metroServer
            });
        });
        // Disable any kind of automatic timeout behavior for incoming
        // requests in case it takes the packager more than the default
        // timeout of 120 seconds to respond to a request.
        httpServer.timeout = 0;
        httpServer.on("close", ()=>{
            end();
        });
    });
};
exports.runServer = runServer;

//# sourceMappingURL=runServer-fork.js.map