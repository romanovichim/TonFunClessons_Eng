"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
var _spawnAsync = _interopRequireDefault(require("@expo/spawn-async"));
var _open = _interopRequireDefault(require("open"));
var _path = _interopRequireDefault(require("path"));
var _launchBrowserTypes = require("./LaunchBrowser.types");
class LaunchBrowserImplLinux {
    MAP = {
        [_launchBrowserTypes.LaunchBrowserTypesEnum.CHROME]: [
            "google-chrome",
            "google-chrome-stable",
            "chromium"
        ],
        [_launchBrowserTypes.LaunchBrowserTypesEnum.EDGE]: [
            "microsoft-edge",
            "microsoft-edge-dev"
        ],
        [_launchBrowserTypes.LaunchBrowserTypesEnum.BRAVE]: [
            "brave"
        ]
    };
    /**
   * On Linux, the supported appId is an array, this function finds the available appId and caches it
   */ async getAppId(browserType) {
        if (this._appId == null || !this.MAP[browserType].includes(this._appId)) {
            for (const appId of this.MAP[browserType]){
                try {
                    const { status  } = await (0, _spawnAsync).default("which", [
                        appId
                    ], {
                        stdio: "ignore"
                    });
                    if (status === 0) {
                        this._appId = appId;
                        break;
                    }
                } catch  {}
            }
        }
        if (this._appId == null) {
            throw new Error(`Unable to find supported browser - tried[${this.MAP[browserType].join(", ")}]`);
        }
        return this._appId;
    }
    async isSupportedBrowser(browserType) {
        let result = false;
        try {
            await this.getAppId(browserType);
            result = true;
        } catch  {
            result = false;
        }
        return result;
    }
    async createTempBrowserDir(baseDirName) {
        return _path.default.join(require("temp-dir"), baseDirName);
    }
    async launchAsync(browserType, args) {
        const appId = await this.getAppId(browserType);
        this._process = await _open.default.openApp(appId, {
            arguments: args
        });
        return this;
    }
    async close() {
        var ref;
        (ref = this._process) == null ? void 0 : ref.kill();
        this._process = undefined;
        this._appId = undefined;
    }
}
exports.default = LaunchBrowserImplLinux;
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}

//# sourceMappingURL=LaunchBrowserImplLinux.js.map