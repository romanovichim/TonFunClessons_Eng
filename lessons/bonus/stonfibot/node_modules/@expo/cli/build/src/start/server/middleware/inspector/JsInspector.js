"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.openJsInspector = openJsInspector;
exports.closeJsInspector = closeJsInspector;
exports.queryInspectorAppAsync = queryInspectorAppAsync;
exports.queryAllInspectorAppsAsync = queryAllInspectorAppsAsync;
var _chalk = _interopRequireDefault(require("chalk"));
var _nodeFetch = _interopRequireDefault(require("node-fetch"));
var _launchBrowser = require("./LaunchBrowser");
var _log = require("../../../../log");
var _env = require("../../../../utils/env");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
let openingBrowserInstance = null;
function openJsInspector(metroBaseUrl, app) {
    if (_env.env.EXPO_USE_UNSTABLE_DEBUGGER) {
        return openExperimentalJsInspector(metroBaseUrl, app);
    } else {
        return openClassicJsInspector(app);
    }
}
async function openExperimentalJsInspector(metroBaseUrl, app) {
    const device = encodeURIComponent(app.id);
    const appId = encodeURIComponent(app.description);
    await (0, _nodeFetch).default(`${metroBaseUrl}/open-debugger?device=${device}&appId=${appId}`, {
        method: "POST"
    });
}
/**
 * Chrome DevTools UI implemented for SDK <49.
 * TODO(cedric): Remove this when we fully swap over to the new React Native JS Inspector.
 */ async function openClassicJsInspector(app) {
    _log.Log.log(_chalk.default`{bold Debug:} Opening JavaScript inspector in the browser...`);
    // To update devtoolsFrontendRev, find the full commit hash in the url:
    // https://chromium.googlesource.com/chromium/src.git/+log/refs/tags/{CHROME_VERSION}/chrome/VERSION
    //
    // 1. Replace {CHROME_VERSION} with the target chrome version
    // 2. Click the first log item in the webpage
    // 3. The full commit hash is the desired revision
    const devtoolsFrontendRev = "d9568d04d7dd79269c5a655d7ada69650c5a8336"; // Chrome 100.0.4896.75
    const urlBase = `https://chrome-devtools-frontend.appspot.com/serve_rev/@${devtoolsFrontendRev}/devtools_app.html`;
    const ws = app.webSocketDebuggerUrl.replace(/^ws:\/\//, "");
    const url = `${urlBase}?panel=console&ws=${encodeURIComponent(ws)}`;
    await closeJsInspector();
    openingBrowserInstance = await (0, _launchBrowser).launchInspectorBrowserAsync(url);
}
async function closeJsInspector() {
    await (openingBrowserInstance == null ? void 0 : openingBrowserInstance.close());
    openingBrowserInstance = null;
}
async function queryInspectorAppAsync(metroServerOrigin, appId) {
    const apps = await queryAllInspectorAppsAsync(metroServerOrigin);
    var ref;
    return (ref = apps.find((app)=>app.description === appId
    )) != null ? ref : null;
}
async function queryAllInspectorAppsAsync(metroServerOrigin) {
    const resp = await (0, _nodeFetch).default(`${metroServerOrigin}/json/list`);
    const apps = transformApps(await resp.json());
    // Only use targets with better reloading support
    return apps.filter((app)=>app.title === "React Native Experimental (Improved Chrome Reloads)"
    );
}
// The description of `React Native Experimental (Improved Chrome Reloads)` target is `don't use` from metro.
// This function tries to transform the unmeaningful description to appId
function transformApps(apps) {
    const deviceIdToAppId = {};
    for (const app1 of apps){
        if (app1.description !== "don't use") {
            const deviceId = app1.id.split("-")[0];
            const appId = app1.description;
            deviceIdToAppId[deviceId] = appId;
        }
    }
    return apps.map((app)=>{
        if (app.description === "don't use") {
            const deviceId = app.id.split("-")[0];
            var _deviceId;
            app.description = (_deviceId = deviceIdToAppId[deviceId]) != null ? _deviceId : app.description;
        }
        return app;
    });
}

//# sourceMappingURL=JsInspector.js.map