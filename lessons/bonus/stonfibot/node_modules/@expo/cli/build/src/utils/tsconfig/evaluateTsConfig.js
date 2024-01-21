"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.evaluateTsConfig = evaluateTsConfig;
exports.importTypeScriptFromProjectOptionally = importTypeScriptFromProjectOptionally;
var _path = _interopRequireDefault(require("path"));
var _resolveFrom = _interopRequireDefault(require("resolve-from"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function evaluateTsConfig(ts, tsConfigPath) {
    const formatDiagnosticsHost = {
        getNewLine: ()=>require("os").EOL
        ,
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getCanonicalFileName: (fileName)=>fileName
    };
    try {
        var ref;
        const { config , error  } = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
        if (error) {
            throw new Error(ts.formatDiagnostic(error, formatDiagnosticsHost));
        }
        const jsonFileContents = ts.parseJsonConfigFileContent(config, {
            ...ts.sys,
            readDirectory: (_, ext)=>[
                    ext ? `file${ext[0]}` : `file.ts`
                ]
        }, _path.default.dirname(tsConfigPath));
        if (jsonFileContents.errors) {
            // filter out "no inputs were found in config file" error
            jsonFileContents.errors = jsonFileContents.errors.filter(({ code  })=>code !== 18003
            );
        }
        if ((ref = jsonFileContents.errors) == null ? void 0 : ref.length) {
            throw new Error(ts.formatDiagnostic(jsonFileContents.errors[0], formatDiagnosticsHost));
        }
        return {
            compilerOptions: jsonFileContents.options,
            raw: config.raw
        };
    } catch (error) {
        if ((error == null ? void 0 : error.name) === "SyntaxError") {
            var _message;
            throw new Error("tsconfig.json is invalid:\n" + ((_message = error.message) != null ? _message : ""));
        }
        throw error;
    }
}
function importTypeScriptFromProjectOptionally(projectRoot) {
    const resolvedPath = _resolveFrom.default.silent(projectRoot, "typescript");
    if (!resolvedPath) {
        return null;
    }
    return require(resolvedPath);
}

//# sourceMappingURL=evaluateTsConfig.js.map