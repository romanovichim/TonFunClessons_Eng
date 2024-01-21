"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DevToolsPluginEndpoint = exports.default = void 0;
var _path = _interopRequireDefault(require("path"));
var _resolveFrom = _interopRequireDefault(require("resolve-from"));
class DevToolsPluginManager {
    constructor(projectRoot){
        this.projectRoot = projectRoot;
        this.plugins = null;
    }
    async queryPluginsAsync() {
        if (this.plugins) {
            return this.plugins;
        }
        const plugins = (await this.queryAutolinkedPluginsAsync(this.projectRoot)).map((plugin)=>({
                ...plugin,
                webpageEndpoint: `${DevToolsPluginEndpoint}/${plugin.packageName}`
            })
        );
        this.plugins = plugins;
        return this.plugins;
    }
    async queryPluginWebpageRootAsync(pluginName) {
        const plugins = await this.queryPluginsAsync();
        const plugin = plugins.find((p)=>p.packageName === pluginName
        );
        var ref;
        return (ref = plugin == null ? void 0 : plugin.webpageRoot) != null ? ref : null;
    }
    async queryAutolinkedPluginsAsync(projectRoot) {
        const expoPackagePath = _resolveFrom.default.silent(projectRoot, "expo/package.json");
        if (!expoPackagePath) {
            return [];
        }
        const resolvedPath = _resolveFrom.default.silent(_path.default.dirname(expoPackagePath), "expo-modules-autolinking/exports");
        if (!resolvedPath) {
            return [];
        }
        const autolinkingModule = require(resolvedPath);
        if (!autolinkingModule.queryAutolinkingModulesFromProjectAsync) {
            throw new Error("Missing exported `queryAutolinkingModulesFromProjectAsync()` function from `expo-modules-autolinking`");
        }
        const plugins = await autolinkingModule.queryAutolinkingModulesFromProjectAsync(projectRoot, {
            platform: "devtools",
            onlyProjectDeps: false
        });
        debug("Found autolinked plugins", this.plugins);
        return plugins;
    }
}
exports.default = DevToolsPluginManager;
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const debug = require("debug")("expo:start:server:devtools");
const DevToolsPluginEndpoint = "/_expo/plugins";
exports.DevToolsPluginEndpoint = DevToolsPluginEndpoint;

//# sourceMappingURL=DevToolsPluginManager.js.map