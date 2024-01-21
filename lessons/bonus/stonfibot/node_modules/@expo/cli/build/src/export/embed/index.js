#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.expoExportEmbed = void 0;
var _chalk = _interopRequireDefault(require("chalk"));
var _path = _interopRequireDefault(require("path"));
var _args = require("../../utils/args");
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
const expoExportEmbed = async (argv)=>{
    const rawArgsMap = {
        // Types
        "--entry-file": String,
        "--platform": String,
        "--transformer": String,
        "--bundle-output": String,
        "--bundle-encoding": String,
        "--max-workers": Number,
        "--sourcemap-output": String,
        "--sourcemap-sources-root": String,
        "--assets-dest": String,
        "--asset-catalog-dest": String,
        "--unstable-transform-profile": String,
        "--config": String,
        // This is here for compatibility with the `npx react-native bundle` command.
        // devs should use `DEBUG=expo:*` instead.
        "--verbose": Boolean,
        "--help": Boolean,
        // Aliases
        "-h": "--help",
        "-v": "--verbose"
    };
    const args = (0, _args).assertWithOptionsArgs(rawArgsMap, {
        argv,
        permissive: true
    });
    if (args["--help"]) {
        (0, _args).printHelp(`(Internal) Export the JavaScript bundle during a native build script for embedding in a native binary`, _chalk.default`npx expo export:embed {dim <dir>}`, [
            _chalk.default`<dir>                                  Directory of the Expo project. {dim Default: Current working directory}`,
            `--entry-file <path>                    Path to the root JS file, either absolute or relative to JS root`,
            `--platform <string>                    Either "ios" or "android" (default: "ios")`,
            `--transformer <string>                 Specify a custom transformer to be used`,
            `--dev [boolean]                        If false, warnings are disabled and the bundle is minified (default: true)`,
            `--minify [boolean]                     Allows overriding whether bundle is minified. This defaults to false if dev is true, and true if dev is false. Disabling minification can be useful for speeding up production builds for testing purposes.`,
            `--bundle-output <string>               File name where to store the resulting bundle, ex. /tmp/groups.bundle`,
            `--bundle-encoding <string>             Encoding the bundle should be written in (https://nodejs.org/api/buffer.html#buffer_buffer). (default: "utf8")`,
            `--max-workers <number>                 Specifies the maximum number of workers the worker-pool will spawn for transforming files. This defaults to the number of the cores available on your machine.`,
            `--sourcemap-output <string>            File name where to store the sourcemap file for resulting bundle, ex. /tmp/groups.map`,
            `--sourcemap-sources-root <string>      Path to make sourcemap's sources entries relative to, ex. /root/dir`,
            `--sourcemap-use-absolute-path          Report SourceMapURL using its full path`,
            `--assets-dest <string>                 Directory name where to store assets referenced in the bundle`,
            `--asset-catalog-dest <string>          Directory to create an iOS Asset Catalog for images`,
            `--unstable-transform-profile <string>  Experimental, transform JS for a specific JS engine. Currently supported: hermes, hermes-canary, default`,
            `--reset-cache                          Removes cached files`,
            `-v, --verbose                          Enables debug logging`,
            `--config <string>                      Path to the CLI configuration file`,
            // This is seemingly unused.
            `--read-global-cache                    Try to fetch transformed JS code from the global cache, if configured.`,
            `-h, --help                             Usage info`, 
        ].join("\n"));
    }
    const [{ exportEmbedAsync  }, { resolveOptions  }, { logCmdError  }, { resolveCustomBooleanArgsAsync  }, ] = await Promise.all([
        Promise.resolve().then(function() {
            return _interopRequireWildcard(require("./exportEmbedAsync.js"));
        }),
        Promise.resolve().then(function() {
            return _interopRequireWildcard(require("./resolveOptions.js"));
        }),
        Promise.resolve().then(function() {
            return _interopRequireWildcard(require("../../utils/errors.js"));
        }),
        Promise.resolve().then(function() {
            return _interopRequireWildcard(require("../../utils/resolveArgs.js"));
        }), 
    ]);
    return (async ()=>{
        const parsed = await resolveCustomBooleanArgsAsync(argv != null ? argv : [], rawArgsMap, {
            "--dev": Boolean,
            "--minify": Boolean,
            "--sourcemap-use-absolute-path": Boolean,
            "--reset-cache": Boolean,
            "--read-global-cache": Boolean
        });
        return exportEmbedAsync(_path.default.resolve(parsed.projectRoot), resolveOptions(args, parsed));
    })().catch(logCmdError);
};
exports.expoExportEmbed = expoExportEmbed;

//# sourceMappingURL=index.js.map