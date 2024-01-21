"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
var osascript = _interopRequireWildcard(require("@expo/osascript"));
var _childProcess = require("child_process");
var _glob = require("glob");
var _path = _interopRequireDefault(require("path"));
var _launchBrowserTypes = require("./LaunchBrowser.types");
class LaunchBrowserImplMacOS {
    MAP = {
        [_launchBrowserTypes.LaunchBrowserTypesEnum.CHROME]: "google chrome",
        [_launchBrowserTypes.LaunchBrowserTypesEnum.EDGE]: "microsoft edge",
        [_launchBrowserTypes.LaunchBrowserTypesEnum.BRAVE]: "brave browser"
    };
    async isSupportedBrowser(browserType) {
        let result = false;
        try {
            await osascript.execAsync(`id of application "${this.MAP[browserType]}"`);
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
        var ref;
        const appDirectory = await osascript.execAsync(`POSIX path of (path to application "${this.MAP[browserType]}")`);
        const appPath = (ref = (0, _glob).sync("Contents/MacOS/*", {
            cwd: appDirectory.trim(),
            absolute: true
        })) == null ? void 0 : ref[0];
        if (!appPath) {
            throw new Error(`Cannot find application path from ${appDirectory}Contents/MacOS`);
        }
        this._process = (0, _childProcess).spawn(appPath, args, {
            stdio: "ignore"
        });
        return this;
    }
    async close() {
        var ref;
        (ref = this._process) == null ? void 0 : ref.kill();
        this._process = undefined;
    }
}
exports.default = LaunchBrowserImplMacOS;
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

//# sourceMappingURL=LaunchBrowserImplMacOS.js.map