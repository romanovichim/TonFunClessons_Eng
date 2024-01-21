"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.createLaunchBrowser = createLaunchBrowser;
exports.findSupportedBrowserTypeAsync = findSupportedBrowserTypeAsync;
exports.launchInspectorBrowserAsync = launchInspectorBrowserAsync;
var _os = _interopRequireDefault(require("os"));
var _launchBrowserTypes = require("./LaunchBrowser.types");
var _launchBrowserImplLinux = _interopRequireDefault(require("./LaunchBrowserImplLinux"));
var _launchBrowserImplMacOS = _interopRequireDefault(require("./LaunchBrowserImplMacOS"));
var _launchBrowserImplWindows = _interopRequireDefault(require("./LaunchBrowserImplWindows"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const IS_WSL = require("is-wsl") && !require("is-docker")();
function createLaunchBrowser() {
    let launchBrowser;
    if (_os.default.platform() === "darwin") {
        launchBrowser = new _launchBrowserImplMacOS.default();
    } else if (_os.default.platform() === "win32" || IS_WSL) {
        launchBrowser = new _launchBrowserImplWindows.default();
    } else if (_os.default.platform() === "linux") {
        launchBrowser = new _launchBrowserImplLinux.default();
    } else {
        throw new Error("[createLaunchBrowser] Unsupported host platform");
    }
    return launchBrowser;
}
async function findSupportedBrowserTypeAsync(launchBrowser) {
    const supportedBrowsers = Object.values(_launchBrowserTypes.LaunchBrowserTypesEnum);
    for (const browserType of supportedBrowsers){
        if (await launchBrowser.isSupportedBrowser(browserType)) {
            return browserType;
        }
    }
    throw new Error(`[findSupportedBrowserTypeAsync] Unable to find a browser on the host to open the inspector. Supported browsers: ${supportedBrowsers.join(", ")}`);
}
async function launchInspectorBrowserAsync(url, browser, browserType) {
    const launchBrowser = browser != null ? browser : createLaunchBrowser();
    const launchBrowserType = browserType != null ? browserType : await findSupportedBrowserTypeAsync(launchBrowser);
    const tempBrowserDir = await launchBrowser.createTempBrowserDir("expo-inspector");
    // For dev-client connecting metro in LAN, the request to fetch sourcemaps may be blocked by Chromium
    // with insecure-content (https page send xhr for http resource).
    // Adding `--allow-running-insecure-content` to overcome this limitation
    // without users manually allow insecure-content in site settings.
    // However, if there is existing chromium browser process, the argument will not take effect.
    // We also pass a `--user-data-dir=` as temporary profile and force chromium to create new browser process.
    const launchArgs = [
        `--app=${url}`,
        "--allow-running-insecure-content",
        `--user-data-dir=${tempBrowserDir}`,
        "--no-first-run",
        "--no-default-browser-check", 
    ];
    return launchBrowser.launchAsync(launchBrowserType, launchArgs);
}

//# sourceMappingURL=LaunchBrowser.js.map