"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getMetroDebugProperties = getMetroDebugProperties;
function getMetroDebugProperties(projectRoot, exp, debugTool) {
    return {
        sdkVersion: exp.sdkVersion,
        metroVersion: require("metro/package.json").version,
        toolName: debugTool.name,
        toolVersion: debugTool.version
    };
}

//# sourceMappingURL=getMetroDebugProperties.js.map