"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DevToolsPluginEndpoint", {
    enumerable: true,
    get: function() {
        return _devToolsPluginManager.DevToolsPluginEndpoint;
    }
});
var _assert = _interopRequireDefault(require("assert"));
var _send = _interopRequireDefault(require("send"));
var _expoMiddleware = require("./ExpoMiddleware");
var _devToolsPluginManager = require("../DevToolsPluginManager");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
class DevToolsPluginMiddleware extends _expoMiddleware.ExpoMiddleware {
    constructor(projectRoot, pluginManager){
        super(projectRoot, [
            _devToolsPluginManager.DevToolsPluginEndpoint
        ]);
        this.pluginManager = pluginManager;
    }
    shouldHandleRequest(req) {
        var ref;
        if (!((ref = req.url) == null ? void 0 : ref.startsWith(_devToolsPluginManager.DevToolsPluginEndpoint))) {
            return false;
        }
        return true;
    }
    async handleRequestAsync(req, res) {
        (0, _assert).default(req.headers.host, "Request headers must include host");
        var _url;
        const { pathname  } = new URL((_url = req.url) != null ? _url : "/", `http://${req.headers.host}`);
        const pluginName = this.queryPossiblePluginName(pathname.substring(_devToolsPluginManager.DevToolsPluginEndpoint.length + 1));
        const webpageRoot = await this.pluginManager.queryPluginWebpageRootAsync(pluginName);
        if (!webpageRoot) {
            res.statusCode = 404;
            res.end();
            return;
        }
        const pathInPluginRoot = pathname.substring(_devToolsPluginManager.DevToolsPluginEndpoint.length + pluginName.length + 1) || "/";
        (0, _send).default(req, pathInPluginRoot, {
            root: webpageRoot
        }).pipe(res);
    }
    queryPossiblePluginName(pathname) {
        const parts = pathname.split("/");
        if (parts[0][0] === "@" && parts.length > 1) {
            // Scoped package name
            return `${parts[0]}/${parts[1]}`;
        }
        return parts[0];
    }
}
exports.DevToolsPluginMiddleware = DevToolsPluginMiddleware;

//# sourceMappingURL=DevToolsPluginMiddleware.js.map