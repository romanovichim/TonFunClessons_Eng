"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
var _assert = _interopRequireDefault(require("assert"));
var _resolveFrom = _interopRequireDefault(require("resolve-from"));
var _asyncNgrok = require("./AsyncNgrok");
var _devToolsPluginManager = _interopRequireDefault(require("./DevToolsPluginManager"));
var _developmentSession = require("./DevelopmentSession");
var _urlCreator = require("./UrlCreator");
var Log = _interopRequireWildcard(require("../../log"));
var _fileNotifier = require("../../utils/FileNotifier");
var _delay = require("../../utils/delay");
var _env = require("../../utils/env");
var _errors = require("../../utils/errors");
var _open = require("../../utils/open");
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
const debug = require("debug")("expo:start:server:devServer");
const PLATFORM_MANAGERS = {
    simulator: ()=>require("../platforms/ios/ApplePlatformManager").ApplePlatformManager
    ,
    emulator: ()=>require("../platforms/android/AndroidPlatformManager").AndroidPlatformManager
};
class BundlerDevServer {
    constructor(projectRoot, platformBundlers, /** Advanced options */ options){
        this.projectRoot = projectRoot;
        this.platformBundlers = platformBundlers;
        this.ngrok = null;
        this.devSession = null;
        this.instance = null;
        this.platformManagers = {};
        this.urlCreator = null;
        this.notifier = null;
        var ref;
        this.devToolsPluginManager = (ref = options == null ? void 0 : options.devToolsPluginManager) != null ? ref : new _devToolsPluginManager.default(projectRoot);
        var ref1;
        this.isDevClient = (ref1 = options == null ? void 0 : options.isDevClient) != null ? ref1 : false;
    }
    setInstance(instance) {
        this.instance = instance;
    }
    /** Get the manifest middleware function. */ async getManifestMiddlewareAsync(options = {}) {
        const Middleware = require("./middleware/ExpoGoManifestHandlerMiddleware").ExpoGoManifestHandlerMiddleware;
        const urlCreator = this.getUrlCreator();
        const middleware = new Middleware(this.projectRoot, {
            constructUrl: urlCreator.constructUrl.bind(urlCreator),
            mode: options.mode,
            minify: options.minify,
            isNativeWebpack: this.name === "webpack" && this.isTargetingNative(),
            privateKeyPath: options.privateKeyPath
        });
        return middleware;
    }
    /** Start the dev server using settings defined in the start command. */ async startAsync(options) {
        await this.stopAsync();
        let instance;
        if (options.headless) {
            instance = await this.startHeadlessAsync(options);
        } else {
            instance = await this.startImplementationAsync(options);
        }
        this.setInstance(instance);
        await this.postStartAsync(options);
        return instance;
    }
    async waitForTypeScriptAsync() {
        return false;
    }
    async watchEnvironmentVariables() {
    // noop -- We've only implemented this functionality in Metro.
    }
    /**
   * Creates a mock server representation that can be used to estimate URLs for a server started in another process.
   * This is used for the run commands where you can reuse the server from a previous run.
   */ async startHeadlessAsync(options) {
        if (!options.port) throw new _errors.CommandError("HEADLESS_SERVER", "headless dev server requires a port option");
        this.urlCreator = this.getUrlCreator(options);
        return {
            // Create a mock server
            server: {
                close: ()=>{
                    this.instance = null;
                },
                addListener () {}
            },
            location: {
                // The port is the main thing we want to send back.
                port: options.port,
                // localhost isn't always correct.
                host: "localhost",
                // http is the only supported protocol on native.
                url: `http://localhost:${options.port}`,
                protocol: "http"
            },
            middleware: {},
            messageSocket: {
                broadcast: ()=>{
                    throw new _errors.CommandError("HEADLESS_SERVER", "Cannot broadcast messages to headless server");
                }
            }
        };
    }
    /**
   * Runs after the `startAsync` function, performing any additional common operations.
   * You can assume the dev server is started by the time this function is called.
   */ async postStartAsync(options) {
        if (options.location.hostType === "tunnel" && !_env.env.EXPO_OFFLINE && // This is a hack to prevent using tunnel on web since we block it upstream for some reason.
        this.isTargetingNative()) {
            await this._startTunnelAsync();
        }
        await this.startDevSessionAsync();
        this.watchConfig();
    }
    watchConfig() {
        var ref;
        (ref = this.notifier) == null ? void 0 : ref.stopObserving();
        this.notifier = new _fileNotifier.FileNotifier(this.projectRoot, this.getConfigModuleIds());
        this.notifier.startObserving();
    }
    /** Create ngrok instance and start the tunnel server. Exposed for testing. */ async _startTunnelAsync() {
        var ref;
        const port = (ref = this.getInstance()) == null ? void 0 : ref.location.port;
        if (!port) return null;
        debug("[ngrok] connect to port: " + port);
        this.ngrok = new _asyncNgrok.AsyncNgrok(this.projectRoot, port);
        await this.ngrok.startAsync();
        return this.ngrok;
    }
    async startDevSessionAsync() {
        var // This is used to make Expo Go open the project in either Expo Go, or the web browser.
        // Must come after ngrok (`startTunnelAsync`) setup.
        ref2;
        (ref2 = this.devSession) == null ? void 0 : ref2.stopNotifying == null ? void 0 : ref2.stopNotifying();
        this.devSession = new _developmentSession.DevelopmentSession(this.projectRoot, // This URL will be used on external devices so the computer IP won't be relevant.
        this.isTargetingNative() ? this.getNativeRuntimeUrl() : this.getDevServerUrl({
            hostType: "localhost"
        }), ()=>{
            var // TODO: This appears to be happening consistently after an hour.
            // We should investigate why this is happening and fix it on our servers.
            // Log.error(
            //   chalk.red(
            //     '\nAn unexpected error occurred while updating the Dev Session API. This project will not appear in the "Development servers" section of the Expo Go app until this process has been restarted.'
            //   )
            // );
            // Log.exception(error);
            ref;
            (ref = this.devSession) == null ? void 0 : ref.closeAsync().catch((error)=>{
                debug("[dev-session] error closing: " + error.message);
            });
        });
        await this.devSession.startAsync({
            runtime: this.isTargetingNative() ? "native" : "web"
        });
    }
    isTargetingNative() {
        // Temporary hack while we implement multi-bundler dev server proxy.
        return true;
    }
    isTargetingWeb() {
        return this.platformBundlers.web === this.name;
    }
    /**
   * Sends a message over web sockets to any connected device,
   * does nothing when the dev server is not running.
   *
   * @param method name of the command. In RN projects `reload`, and `devMenu` are available. In Expo Go, `sendDevCommand` is available.
   * @param params
   */ broadcastMessage(method, params) {
        var ref;
        (ref = this.getInstance()) == null ? void 0 : ref.messageSocket.broadcast(method, params);
    }
    /** Get the running dev server instance. */ getInstance() {
        return this.instance;
    }
    /** Stop the running dev server instance. */ async stopAsync() {
        var // Stop file watching.
        ref5, ref3, ref4;
        (ref5 = this.notifier) == null ? void 0 : ref5.stopObserving();
        // Stop the dev session timer and tell Expo API to remove dev session.
        await ((ref3 = this.devSession) == null ? void 0 : ref3.closeAsync());
        // Stop ngrok if running.
        await ((ref4 = this.ngrok) == null ? void 0 : ref4.stopAsync().catch((e)=>{
            Log.error(`Error stopping ngrok:`);
            Log.exception(e);
        }));
        return (0, _delay).resolveWithTimeout(()=>{
            return new Promise((resolve, reject)=>{
                var ref;
                // Close the server.
                debug(`Stopping dev server (bundler: ${this.name})`);
                if ((ref = this.instance) == null ? void 0 : ref.server) {
                    this.instance.server.close((error)=>{
                        debug(`Stopped dev server (bundler: ${this.name})`);
                        this.instance = null;
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    debug(`Stopped dev server (bundler: ${this.name})`);
                    this.instance = null;
                    resolve();
                }
            });
        }, {
            // NOTE(Bacon): Metro dev server doesn't seem to be closing in time.
            timeout: 1000,
            errorMessage: `Timeout waiting for '${this.name}' dev server to close`
        });
    }
    getUrlCreator(options = {}) {
        if (!this.urlCreator) {
            (0, _assert).default(options == null ? void 0 : options.port, "Dev server instance not found");
            this.urlCreator = new _urlCreator.UrlCreator(options.location, {
                port: options.port,
                getTunnelUrl: this.getTunnelUrl.bind(this)
            });
        }
        return this.urlCreator;
    }
    getNativeRuntimeUrl(opts = {}) {
        var ref;
        return this.isDevClient ? (ref = this.getUrlCreator().constructDevClientUrl(opts)) != null ? ref : this.getDevServerUrl() : this.getUrlCreator().constructUrl({
            ...opts,
            scheme: "exp"
        });
    }
    /** Get the URL for the running instance of the dev server. */ getDevServerUrl(options = {}) {
        const instance = this.getInstance();
        if (!(instance == null ? void 0 : instance.location)) {
            return null;
        }
        const { location  } = instance;
        if (options.hostType === "localhost") {
            return `${location.protocol}://localhost:${location.port}`;
        }
        var _url;
        return (_url = location.url) != null ? _url : null;
    }
    /** Get the base URL for JS inspector */ getJsInspectorBaseUrl() {
        if (this.name !== "metro") {
            throw new _errors.CommandError("DEV_SERVER", `Cannot get the JS inspector base url - bundler[${this.name}]`);
        }
        return this.getUrlCreator().constructUrl({
            scheme: "http"
        });
    }
    /** Get the tunnel URL from ngrok. */ getTunnelUrl() {
        var ref;
        var ref6;
        return (ref6 = (ref = this.ngrok) == null ? void 0 : ref.getActiveUrl()) != null ? ref6 : null;
    }
    /** Open the dev server in a runtime. */ async openPlatformAsync(launchTarget, resolver = {}) {
        if (launchTarget === "desktop") {
            const serverUrl = this.getDevServerUrl({
                hostType: "localhost"
            });
            var ref;
            // Allow opening the tunnel URL when using Metro web.
            const url = this.name === "metro" ? (ref = this.getTunnelUrl()) != null ? ref : serverUrl : serverUrl;
            await (0, _open).openBrowserAsync(url);
            return {
                url
            };
        }
        const runtime = this.isTargetingNative() ? this.isDevClient ? "custom" : "expo" : "web";
        const manager = await this.getPlatformManagerAsync(launchTarget);
        return manager.openAsync({
            runtime
        }, resolver);
    }
    /** Open the dev server in a runtime. */ async openCustomRuntimeAsync(launchTarget, launchProps = {}, resolver = {}) {
        const runtime = this.isTargetingNative() ? this.isDevClient ? "custom" : "expo" : "web";
        if (runtime !== "custom") {
            throw new _errors.CommandError(`dev server cannot open custom runtimes either because it does not target native platforms or because it is not targeting dev clients. (target: ${runtime})`);
        }
        const manager = await this.getPlatformManagerAsync(launchTarget);
        return manager.openAsync({
            runtime: "custom",
            props: launchProps
        }, resolver);
    }
    /** Get the URL for opening in Expo Go. */ getExpoGoUrl() {
        return this.getUrlCreator().constructUrl({
            scheme: "exp"
        });
    }
    /** Should use the interstitial page for selecting which runtime to use. */ isRedirectPageEnabled() {
        return !_env.env.EXPO_NO_REDIRECT_PAGE && // if user passed --dev-client flag, skip interstitial page
        !this.isDevClient && // Checks if dev client is installed.
        !!_resolveFrom.default.silent(this.projectRoot, "expo-dev-client");
    }
    /** Get the redirect URL when redirecting is enabled. */ getRedirectUrl(platform = null) {
        if (!this.isRedirectPageEnabled()) {
            debug("Redirect page is disabled");
            return null;
        }
        var ref;
        return (ref = this.getUrlCreator().constructLoadingUrl({}, platform === "emulator" ? "android" : platform === "simulator" ? "ios" : null)) != null ? ref : null;
    }
    getReactDevToolsUrl() {
        return new URL("_expo/react-devtools", this.getUrlCreator().constructUrl({
            scheme: "http"
        })).toString();
    }
    async getPlatformManagerAsync(platform) {
        if (!this.platformManagers[platform]) {
            var ref;
            const Manager = PLATFORM_MANAGERS[platform]();
            const port = (ref = this.getInstance()) == null ? void 0 : ref.location.port;
            if (!port || !this.urlCreator) {
                throw new _errors.CommandError("DEV_SERVER", "Cannot interact with native platforms until dev server has started");
            }
            debug(`Creating platform manager (platform: ${platform}, port: ${port})`);
            this.platformManagers[platform] = new Manager(this.projectRoot, port, {
                getCustomRuntimeUrl: this.urlCreator.constructDevClientUrl.bind(this.urlCreator),
                getExpoGoUrl: this.getExpoGoUrl.bind(this),
                getRedirectUrl: this.getRedirectUrl.bind(this, platform),
                getDevServerUrl: this.getDevServerUrl.bind(this, {
                    hostType: "localhost"
                })
            });
        }
        return this.platformManagers[platform];
    }
}
exports.BundlerDevServer = BundlerDevServer;

//# sourceMappingURL=BundlerDevServer.js.map