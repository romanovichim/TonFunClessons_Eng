"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.customizeAsync = customizeAsync;
var _config = require("@expo/config");
var _generate = require("./generate");
var _platformBundlers = require("../start/server/platformBundlers");
var _findUp = require("../utils/findUp");
var _nodeEnv = require("../utils/nodeEnv");
async function customizeAsync(files, options, extras) {
    var ref;
    (0, _nodeEnv).setNodeEnv("development");
    // Locate the project root based on the process current working directory.
    // This enables users to run `npx expo customize` from a subdirectory of the project.
    const projectRoot = (0, _findUp).findUpProjectRootOrAssert(process.cwd());
    require("@expo/env").load(projectRoot);
    // Get the static path (defaults to 'web/')
    // Doesn't matter if expo is installed or which mode is used.
    const { exp  } = (0, _config).getConfig(projectRoot, {
        skipSDKVersionRequirement: true
    });
    var ref1;
    // Create the destination resolution props which are used in both
    // the query and select functions.
    const props = {
        webStaticPath: ((ref1 = (ref = exp.web) == null ? void 0 : ref.staticPath) != null ? ref1 : (0, _platformBundlers).getPlatformBundlers(projectRoot, exp).web === "webpack") ? "web" : "public"
    };
    // If the user provided files, we'll generate them without prompting.
    if (files.length) {
        return (0, _generate).queryAndGenerateAsync(projectRoot, {
            files,
            props,
            extras
        });
    }
    // Otherwise, we'll prompt the user to select which files to generate.
    await (0, _generate).selectAndGenerateAsync(projectRoot, {
        props,
        extras
    });
}

//# sourceMappingURL=customizeAsync.js.map