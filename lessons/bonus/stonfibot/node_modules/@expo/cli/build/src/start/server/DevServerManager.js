"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
var _config = require("@expo/config");
var _assert = _interopRequireDefault(require("assert"));
var _chalk = _interopRequireDefault(require("chalk"));
var _devToolsPluginManager = _interopRequireDefault(require("./DevToolsPluginManager"));
var _platformBundlers = require("./platformBundlers");
var _log = require("../../log");
var _fileNotifier = require("../../utils/FileNotifier");
var _rudderstackClient = require("../../utils/analytics/rudderstackClient");
var _env = require("../../utils/env");
var _typeScriptProjectPrerequisite = require("../doctor/typescript/TypeScriptProjectPrerequisite");
var _commandsTable = require("../interface/commandsTable");
var AndroidDebugBridge = _interopRequireWildcard(require("../platforms/android/adb"));
var _resolveOptions = require("../resolveOptions");
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
var _urlCreator;
const debug = require("debug")("expo:start:server:devServerManager");
const devServers = [];
const BUNDLERS = {
    webpack: ()=>require("./webpack/WebpackBundlerDevServer").WebpackBundlerDevServer
    ,
    metro: ()=>require("./metro/MetroBundlerDevServer").MetroBundlerDevServer
};
class DevServerManager {
    constructor(projectRoot, options){
        this.projectRoot = projectRoot;
        this.options = options;
        this.projectPrerequisites = [];
        this.notifier = null;
        this.notifier = this.watchBabelConfig();
        this.devtoolsPluginManager = new _devToolsPluginManager.default(projectRoot);
    }
    watchBabelConfig() {
        const notifier = new _fileNotifier.FileNotifier(this.projectRoot, [
            "./babel.config.js",
            "./babel.config.json",
            "./.babelrc.json",
            "./.babelrc",
            "./.babelrc.js", 
        ], {
            additionalWarning: _chalk.default` You may need to clear the bundler cache with the {bold --clear} flag for your changes to take effect.`
        });
        notifier.startObserving();
        return notifier;
    }
    /** Lazily load and assert a project-level prerequisite. */ async ensureProjectPrerequisiteAsync(PrerequisiteClass) {
        let prerequisite1 = this.projectPrerequisites.find((prerequisite)=>prerequisite instanceof PrerequisiteClass
        );
        if (!prerequisite1) {
            prerequisite1 = new PrerequisiteClass(this.projectRoot);
            this.projectPrerequisites.push(prerequisite1);
        }
        return await prerequisite1.assertAsync();
    }
    /**
   * Sends a message over web sockets to all connected devices,
   * does nothing when the dev server is not running.
   *
   * @param method name of the command. In RN projects `reload`, and `devMenu` are available. In Expo Go, `sendDevCommand` is available.
   * @param params extra event info to send over the socket.
   */ broadcastMessage(method, params) {
        devServers.forEach((server)=>{
            server.broadcastMessage(method, params);
        });
    }
    /** Get the port for the dev server (either Webpack or Metro) that is hosting code for React Native runtimes. */ getNativeDevServerPort() {
        var ref;
        const server1 = devServers.find((server)=>server.isTargetingNative()
        );
        var _port;
        return (_port = (ref = server1 == null ? void 0 : server1.getInstance()) == null ? void 0 : ref.location.port) != null ? _port : null;
    }
    /** Get the first server that targets web. */ getWebDevServer() {
        const server2 = devServers.find((server)=>server.isTargetingWeb()
        );
        return server2 != null ? server2 : null;
    }
    getDefaultDevServer() {
        // Return the first native dev server otherwise return the first dev server.
        const server3 = devServers.find((server)=>server.isTargetingNative()
        );
        const defaultServer = server3 != null ? server3 : devServers[0];
        (0, _assert).default(defaultServer, "No dev servers are running");
        return defaultServer;
    }
    async ensureWebDevServerRunningAsync() {
        const [server4] = devServers.filter((server)=>server.isTargetingWeb()
        );
        if (server4) {
            return;
        }
        const { exp  } = (0, _config).getConfig(this.projectRoot, {
            skipPlugins: true,
            skipSDKVersionRequirement: true
        });
        const bundler = (0, _platformBundlers).getPlatformBundlers(this.projectRoot, exp).web;
        debug(`Starting ${bundler} dev server for web`);
        return this.startAsync([
            {
                type: bundler,
                options: this.options
            }, 
        ]);
    }
    /** Switch between Expo Go and Expo Dev Clients. */ async toggleRuntimeMode(isUsingDevClient = !this.options.devClient) {
        const nextMode = isUsingDevClient ? "--dev-client" : "--go";
        _log.Log.log((0, _commandsTable).printItem(_chalk.default`Switching to {bold ${nextMode}}`));
        const nextScheme = await (0, _resolveOptions).resolveSchemeAsync(this.projectRoot, {
            devClient: isUsingDevClient
        });
        this.options.location.scheme = nextScheme;
        this.options.devClient = isUsingDevClient;
        for (const devServer of devServers){
            devServer.isDevClient = isUsingDevClient;
            const urlCreator = devServer.getUrlCreator();
            var _defaults;
            (_defaults = (_urlCreator = urlCreator).defaults) != null ? _defaults : _urlCreator.defaults = {};
            urlCreator.defaults.scheme = nextScheme;
        }
        debug(`New runtime options (runtime: ${nextMode}):`, this.options);
        return true;
    }
    /** Start all dev servers. */ async startAsync(startOptions) {
        const { exp  } = (0, _config).getConfig(this.projectRoot, {
            skipSDKVersionRequirement: true
        });
        var _sdkVersion;
        await (0, _rudderstackClient).logEventAsync("Start Project", {
            sdkVersion: (_sdkVersion = exp.sdkVersion) != null ? _sdkVersion : null
        });
        const platformBundlers = (0, _platformBundlers).getPlatformBundlers(this.projectRoot, exp);
        // Start all dev servers...
        for (const { type , options  } of startOptions){
            const BundlerDevServerClass = await BUNDLERS[type]();
            const server = new BundlerDevServerClass(this.projectRoot, platformBundlers, {
                devToolsPluginManager: this.devtoolsPluginManager,
                isDevClient: !!(options == null ? void 0 : options.devClient)
            });
            await server.startAsync(options != null ? options : this.options);
            devServers.push(server);
        }
        return exp;
    }
    async bootstrapTypeScriptAsync() {
        const typescriptPrerequisite = await this.ensureProjectPrerequisiteAsync(_typeScriptProjectPrerequisite.TypeScriptProjectPrerequisite);
        if (_env.env.EXPO_NO_TYPESCRIPT_SETUP) {
            return;
        }
        // Optionally, wait for the user to add TypeScript during the
        // development cycle.
        const server5 = devServers.find((server)=>server.name === "metro"
        );
        if (!server5) {
            return;
        }
        // The dev server shouldn't wait for the typescript services
        if (!typescriptPrerequisite) {
            server5.waitForTypeScriptAsync().then(async (success)=>{
                if (success) {
                    server5.startTypeScriptServices();
                }
            });
        } else {
            server5.startTypeScriptServices();
        }
    }
    async watchEnvironmentVariables() {
        var ref;
        await ((ref = devServers.find((server)=>server.name === "metro"
        )) == null ? void 0 : ref.watchEnvironmentVariables());
    }
    /** Stop all servers including ADB. */ async stopAsync() {
        var ref;
        await Promise.allSettled([
            (ref = this.notifier) == null ? void 0 : ref.stopObserving(),
            // Stop all dev servers
            ...devServers.map((server)=>server.stopAsync()
            ),
            // Stop ADB
            AndroidDebugBridge.getServer().stopAsync(), 
        ]);
    }
}
exports.DevServerManager = DevServerManager;

//# sourceMappingURL=DevServerManager.js.map