"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getSessionUsingBrowserAuthFlowAsync = getSessionUsingBrowserAuthFlowAsync;
var _assert = _interopRequireDefault(require("assert"));
var _betterOpn = _interopRequireDefault(require("better-opn"));
var _http = _interopRequireDefault(require("http"));
var _querystring = _interopRequireDefault(require("querystring"));
var Log = _interopRequireWildcard(require("../../log"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    } else {
        var newObj = {};
        if (obj != null) {
            for(var key in obj){
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};
                    if (desc.get || desc.set) {
                        Object.defineProperty(newObj, key, desc);
                    } else {
                        newObj[key] = obj[key];
                    }
                }
            }
        }
        newObj.default = obj;
        return newObj;
    }
}
const successBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Expo SSO Login</title>
  <meta charset="utf-8">
  <style type="text/css">
    html {
      margin: 0;
      padding: 0
    }

    body {
      background-color: #fff;
      font-family: Tahoma,Verdana;
      font-size: 16px;
      color: #000;
      max-width: 100%;
      box-sizing: border-box;
      padding: .5rem;
      margin: 1em;
      overflow-wrap: break-word
    }
  </style>
</head>
<body>
  SSO login complete. You may now close this tab and return to the command prompt.
</body>
</html>`;
async function getSessionUsingBrowserAuthFlowAsync({ expoWebsiteUrl  }) {
    const scheme = "http";
    const hostname = "localhost";
    const path = "/auth/callback";
    const buildExpoSsoLoginUrl = (port)=>{
        const data = {
            app_redirect_uri: `${scheme}://${hostname}:${port}${path}`
        };
        const params = _querystring.default.stringify(data);
        return `${expoWebsiteUrl}/sso-login?${params}`;
    };
    // Start server and begin auth flow
    const executeAuthFlow = ()=>{
        return new Promise(async (resolve, reject)=>{
            const connections = new Set();
            const server = _http.default.createServer((request, response)=>{
                try {
                    var ref;
                    if (!(request.method === "GET" && ((ref = request.url) == null ? void 0 : ref.includes(path)))) {
                        throw new Error("Unexpected SSO login response.");
                    }
                    const url = new URL(request.url, `http:${request.headers.host}`);
                    const sessionSecret = url.searchParams.get("session_secret");
                    if (!sessionSecret) {
                        throw new Error("Request missing session_secret search parameter.");
                    }
                    resolve(sessionSecret);
                    response.writeHead(200, {
                        "Content-Type": "text/html"
                    });
                    response.write(successBody);
                    response.end();
                } catch (error) {
                    reject(error);
                } finally{
                    server.close();
                    // Ensure that the server shuts down
                    for (const connection of connections){
                        connection.destroy();
                    }
                }
            });
            server.listen(0, hostname, ()=>{
                Log.log("Waiting for browser login...");
                const address = server.address();
                (0, _assert).default(address !== null && typeof address === "object", "Server address and port should be set after listening has begun");
                const port = address.port;
                const authorizeUrl = buildExpoSsoLoginUrl(port);
                (0, _betterOpn).default(authorizeUrl);
            });
            server.on("connection", (connection)=>{
                connections.add(connection);
                connection.on("close", ()=>{
                    connections.delete(connection);
                });
            });
        });
    };
    return await executeAuthFlow();
}

//# sourceMappingURL=expoSsoLauncher.js.map