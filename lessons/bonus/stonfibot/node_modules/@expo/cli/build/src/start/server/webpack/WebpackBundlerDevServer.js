"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getProjectWebpackConfigFilePath = getProjectWebpackConfigFilePath;
var _chalk = _interopRequireDefault(require("chalk"));
var _fs = _interopRequireDefault(require("fs"));
var path = _interopRequireWildcard(require("path"));
var _resolveFrom = _interopRequireDefault(require("resolve-from"));
var _compile = require("./compile");
var _resolveFromProject = require("./resolveFromProject");
var _tls = require("./tls");
var Log = _interopRequireWildcard(require("../../../log"));
var _env = require("../../../utils/env");
var _errors = require("../../../utils/errors");
var _ip = require("../../../utils/ip");
var _nodeEnv = require("../../../utils/nodeEnv");
var _port = require("../../../utils/port");
var _progress = require("../../../utils/progress");
var _dotExpo = require("../../project/dotExpo");
var _bundlerDevServer = require("../BundlerDevServer");
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
const debug = require("debug")("expo:start:server:webpack:devServer");
function assertIsWebpackDevServer(value) {
    if (!(value == null ? void 0 : value.sockWrite) && !(value == null ? void 0 : value.sendMessage)) {
        var ref;
        var ref1;
        throw new _errors.CommandError("WEBPACK", value ? "Expected Webpack dev server, found: " + ((ref1 = (ref = value.constructor) == null ? void 0 : ref.name) != null ? ref1 : value) : "Webpack dev server not started yet.");
    }
}
class WebpackBundlerDevServer extends _bundlerDevServer.BundlerDevServer {
    get name() {
        return "webpack";
    }
    async startTypeScriptServices() {
    //  noop -- this feature is Metro-only.
    }
    broadcastMessage(method, params) {
        var ref;
        if (!this.instance) {
            return;
        }
        assertIsWebpackDevServer((ref = this.instance) == null ? void 0 : ref.server);
        // TODO(EvanBacon): Custom Webpack overlay.
        // Default webpack-dev-server sockets use "content-changed" instead of "reload" (what we use on native).
        // For now, just manually convert the value so our CLI interface can be unified.
        const hackyConvertedMessage = method === "reload" ? "content-changed" : method;
        if ("sendMessage" in this.instance.server) {
            // @ts-expect-error: https://github.com/expo/expo/issues/21994#issuecomment-1517122501
            this.instance.server.sendMessage(this.instance.server.sockets, hackyConvertedMessage, params);
        } else {
            this.instance.server.sockWrite(this.instance.server.sockets, hackyConvertedMessage, params);
        }
    }
    isTargetingNative() {
        return false;
    }
    async getAvailablePortAsync(options) {
        try {
            var ref;
            const defaultPort = (ref = options == null ? void 0 : options.defaultPort) != null ? ref : 19006;
            const port = await (0, _port).choosePortAsync(this.projectRoot, {
                defaultPort,
                host: _env.env.WEB_HOST
            });
            if (!port) {
                throw new _errors.CommandError("NO_PORT_FOUND", `Port ${defaultPort} not available.`);
            }
            return port;
        } catch (error) {
            throw new _errors.CommandError("NO_PORT_FOUND", error.message);
        }
    }
    async bundleAsync({ mode , clear  }) {
        // Do this first to fail faster.
        const webpack = (0, _resolveFromProject).importWebpackFromProject(this.projectRoot);
        if (clear) {
            await this.clearWebProjectCacheAsync(this.projectRoot, mode);
        }
        const config = await this.loadConfigAsync({
            isImageEditingEnabled: true,
            mode
        });
        if (!config.plugins) {
            config.plugins = [];
        }
        const bar = (0, _progress).createProgressBar(_chalk.default`{bold Web} Bundling Javascript [:bar] :percent`, {
            width: 64,
            total: 100,
            clear: true,
            complete: "=",
            incomplete: " "
        });
        // NOTE(EvanBacon): Add a progress bar to the webpack logger if defined (e.g. not in CI).
        if (bar != null) {
            config.plugins.push(new webpack.ProgressPlugin((percent)=>{
                bar == null ? void 0 : bar.update(percent);
                if (percent === 1) {
                    bar == null ? void 0 : bar.terminate();
                }
            }));
        }
        // Create a webpack compiler that is configured with custom messages.
        const compiler = webpack(config);
        try {
            await (0, _compile).compileAsync(compiler);
        } catch (error) {
            Log.error(_chalk.default.red("Failed to compile"));
            throw error;
        } finally{
            bar == null ? void 0 : bar.terminate();
        }
    }
    async startImplementationAsync(options) {
        // Do this first to fail faster.
        const webpack = (0, _resolveFromProject).importWebpackFromProject(this.projectRoot);
        const WebpackDevServer = (0, _resolveFromProject).importWebpackDevServerFromProject(this.projectRoot);
        await this.stopAsync();
        options.port = await this.getAvailablePortAsync({
            defaultPort: options.port
        });
        const { resetDevServer , https , port , mode  } = options;
        this.urlCreator = this.getUrlCreator({
            port,
            location: {
                scheme: https ? "https" : "http"
            }
        });
        debug("Starting webpack on port: " + port);
        if (resetDevServer) {
            await this.clearWebProjectCacheAsync(this.projectRoot, mode);
        }
        if (https) {
            debug("Configuring TLS to enable HTTPS support");
            await (0, _tls).ensureEnvironmentSupportsTLSAsync(this.projectRoot).catch((error)=>{
                Log.error(`Error creating TLS certificates: ${error}`);
            });
        }
        const config = await this.loadConfigAsync(options);
        Log.log(_chalk.default`Starting Webpack on port ${port} in {underline ${mode}} mode.`);
        // Create a webpack compiler that is configured with custom messages.
        const compiler = webpack(config);
        const server = new WebpackDevServer(// @ts-expect-error: type mismatch -- Webpack types aren't great.
        compiler, config.devServer);
        // Launch WebpackDevServer.
        server.listen(port, _env.env.WEB_HOST, function(error) {
            if (error) {
                Log.error(error.message);
            }
        });
        // Extend the close method to ensure that we clean up the local info.
        const originalClose = server.close.bind(server);
        server.close = (callback)=>{
            return originalClose((err)=>{
                this.instance = null;
                callback == null ? void 0 : callback(err);
            });
        };
        const _host = (0, _ip).getIpAddress();
        const protocol = https ? "https" : "http";
        return {
            // Server instance
            server,
            // URL Info
            location: {
                url: `${protocol}://${_host}:${port}`,
                port,
                protocol,
                host: _host
            },
            middleware: null,
            // Match the native protocol.
            messageSocket: {
                broadcast: this.broadcastMessage
            }
        };
    }
    /** Load the Webpack config. Exposed for testing. */ getProjectConfigFilePath() {
        var ref;
        // Check if the project has a webpack.config.js in the root.
        return (ref = this.getConfigModuleIds().reduce((prev, moduleId)=>prev || _resolveFrom.default.silent(this.projectRoot, moduleId)
        , null)) != null ? ref : null;
    }
    async loadConfigAsync(options, argv) {
        // let bar: ProgressBar | null = null;
        const env = {
            projectRoot: this.projectRoot,
            pwa: !!options.isImageEditingEnabled,
            // TODO: Use a new loader in Webpack config...
            logger: {
                info () {}
            },
            mode: options.mode,
            https: options.https
        };
        var _mode;
        (0, _nodeEnv).setNodeEnv((_mode = env.mode) != null ? _mode : "development");
        require("@expo/env").load(env.projectRoot);
        // Check if the project has a webpack.config.js in the root.
        const projectWebpackConfig = this.getProjectConfigFilePath();
        let config;
        if (projectWebpackConfig) {
            const webpackConfig = require(projectWebpackConfig);
            if (typeof webpackConfig === "function") {
                config = await webpackConfig(env, argv);
            } else {
                config = webpackConfig;
            }
        } else {
            // Fallback to the default expo webpack config.
            const loadDefaultConfigAsync = (0, _resolveFromProject).importExpoWebpackConfigFromProject(this.projectRoot);
            // @ts-expect-error: types appear to be broken
            config = await loadDefaultConfigAsync(env, argv);
        }
        return config;
    }
    getConfigModuleIds() {
        return [
            "./webpack.config.js"
        ];
    }
    async clearWebProjectCacheAsync(projectRoot, mode = "development") {
        Log.log(_chalk.default.dim(`Clearing Webpack ${mode} cache directory...`));
        const dir = await (0, _dotExpo).ensureDotExpoProjectDirectoryInitialized(projectRoot);
        const cacheFolder = path.join(dir, "web/cache", mode);
        try {
            await _fs.default.promises.rm(cacheFolder, {
                recursive: true,
                force: true
            });
        } catch (error) {
            Log.error(`Could not clear ${mode} web cache directory: ${error.message}`);
        }
    }
}
exports.WebpackBundlerDevServer = WebpackBundlerDevServer;
function getProjectWebpackConfigFilePath(projectRoot) {
    return _resolveFrom.default.silent(projectRoot, "./webpack.config.js");
}

//# sourceMappingURL=WebpackBundlerDevServer.js.map