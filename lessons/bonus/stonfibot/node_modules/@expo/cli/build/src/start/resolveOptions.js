"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.resolveOptionsAsync = resolveOptionsAsync;
exports.resolveSchemeAsync = resolveSchemeAsync;
exports.resolveHostType = resolveHostType;
exports.resolvePortsAsync = resolvePortsAsync;
var _assert = _interopRequireDefault(require("assert"));
var _getDevClientProperties = require("../utils/analytics/getDevClientProperties");
var _errors = require("../utils/errors");
var _port = require("../utils/port");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function resolveOptionsAsync(projectRoot, args) {
    if (args["--dev-client"] && args["--go"]) {
        throw new _errors.CommandError("BAD_ARGS", "Cannot use both --dev-client and --go together.");
    }
    const host = resolveHostType({
        host: args["--host"],
        offline: args["--offline"],
        lan: args["--lan"],
        localhost: args["--localhost"],
        tunnel: args["--tunnel"]
    });
    // User can force the default target by passing either `--dev-client` or `--go`. They can also
    // swap between them during development by pressing `s`.
    const isUserDefinedDevClient = !!args["--dev-client"] || (args["--go"] == null ? false : !args["--go"]);
    // If the user didn't specify `--dev-client` or `--go` we check if they have the dev client package
    // in their package.json.
    const isAutoDevClient = args["--dev-client"] == null && args["--go"] == null && (0, _getDevClientProperties).hasDirectDevClientDependency(projectRoot);
    const isDevClient = isAutoDevClient || isUserDefinedDevClient;
    const scheme = await resolveSchemeAsync(projectRoot, {
        scheme: args["--scheme"],
        devClient: isDevClient
    });
    var ref;
    return {
        privateKeyPath: (ref = args["--private-key-path"]) != null ? ref : null,
        android: !!args["--android"],
        web: !!args["--web"],
        ios: !!args["--ios"],
        offline: !!args["--offline"],
        clear: !!args["--clear"],
        dev: !args["--no-dev"],
        https: !!args["--https"],
        maxWorkers: args["--max-workers"],
        port: args["--port"],
        minify: !!args["--minify"],
        devClient: isDevClient,
        scheme,
        host
    };
}
async function resolveSchemeAsync(projectRoot, options) {
    const resolveFrom = require("resolve-from");
    const isDevClientPackageInstalled = (()=>{
        try {
            // we check if `expo-dev-launcher` is installed instead of `expo-dev-client`
            // because someone could install only launcher.
            resolveFrom(projectRoot, "expo-dev-launcher");
            return true;
        } catch  {
            return false;
        }
    })();
    if (typeof options.scheme === "string") {
        var _scheme;
        // Use the custom scheme
        return (_scheme = options.scheme) != null ? _scheme : null;
    } else if (options.devClient || isDevClientPackageInstalled) {
        const { getOptionalDevClientSchemeAsync  } = require("../utils/scheme");
        // Attempt to find the scheme or warn the user how to setup a custom scheme
        return await getOptionalDevClientSchemeAsync(projectRoot);
    } else {
        // Ensure this is reset when users don't use `--scheme`, `--dev-client` and don't have the `expo-dev-client` package installed.
        return null;
    }
}
function resolveHostType(options) {
    if ([
        options.offline,
        options.host,
        options.lan,
        options.localhost,
        options.tunnel
    ].filter((i)=>i
    ).length > 1) {
        throw new _errors.CommandError("BAD_ARGS", "Specify at most one of: --offline, --host, --tunnel, --lan, --localhost");
    }
    if (options.offline) {
        // Force `lan` in offline mode.
        return "lan";
    } else if (options.host) {
        _assert.default.match(options.host, /^(lan|tunnel|localhost)$/);
        return options.host;
    } else if (options.tunnel) {
        return "tunnel";
    } else if (options.lan) {
        return "lan";
    } else if (options.localhost) {
        return "localhost";
    }
    return "lan";
}
async function resolvePortsAsync(projectRoot, options, settings) {
    const multiBundlerSettings = {};
    if (settings.webOnly) {
        const webpackPort = await (0, _port).resolvePortAsync(projectRoot, {
            defaultPort: options.port,
            // Default web port
            fallbackPort: 19006
        });
        if (!webpackPort) {
            throw new _errors.AbortCommandError();
        }
        multiBundlerSettings.webpackPort = webpackPort;
    } else {
        const fallbackPort = process.env.RCT_METRO_PORT ? parseInt(process.env.RCT_METRO_PORT, 10) : 8081;
        const metroPort = await (0, _port).resolvePortAsync(projectRoot, {
            defaultPort: options.port,
            fallbackPort
        });
        if (!metroPort) {
            throw new _errors.AbortCommandError();
        }
        multiBundlerSettings.metroPort = metroPort;
    }
    return multiBundlerSettings;
}

//# sourceMappingURL=resolveOptions.js.map