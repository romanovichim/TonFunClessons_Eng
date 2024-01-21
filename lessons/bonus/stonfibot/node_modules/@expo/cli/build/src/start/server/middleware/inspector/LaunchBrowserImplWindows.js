"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
var _spawnAsync = _interopRequireDefault(require("@expo/spawn-async"));
var _open = _interopRequireDefault(require("open"));
var _path = _interopRequireDefault(require("path"));
var _launchBrowserTypes = require("./LaunchBrowser.types");
class LaunchBrowserImplWindows {
    MAP = {
        [_launchBrowserTypes.LaunchBrowserTypesEnum.CHROME]: {
            appId: "chrome"
        },
        [_launchBrowserTypes.LaunchBrowserTypesEnum.EDGE]: {
            appId: "msedge"
        },
        [_launchBrowserTypes.LaunchBrowserTypesEnum.BRAVE]: {
            appId: "brave"
        }
    };
    async isSupportedBrowser(browserType) {
        let result = false;
        try {
            const env = await this.getPowershellEnv();
            const { status  } = await (0, _spawnAsync).default("powershell.exe", [
                "-c",
                `Get-Package -Name '${browserType}'`
            ], {
                // @ts-expect-error: Missing NODE_ENV
                env,
                stdio: "ignore"
            });
            result = status === 0;
        } catch  {
            result = false;
        }
        return result;
    }
    async createTempBrowserDir(baseDirName) {
        let tmpDir;
        if (IS_WSL) {
            // On WSL, the browser is actually launched in host, the `temp-dir` returns the linux /tmp path where host browsers cannot reach into.
            // We should get the temp path through the `$TEMP` windows environment variable.
            tmpDir = (await (0, _spawnAsync).default("powershell.exe", [
                "-c",
                'echo "$Env:TEMP"'
            ])).stdout.trim();
            return `${tmpDir}\\${baseDirName}`;
        } else {
            tmpDir = require("temp-dir");
            return _path.default.join(tmpDir, baseDirName);
        }
    }
    async launchAsync(browserType, args) {
        const appId = this.MAP[browserType].appId;
        await openWithSystemRootEnvironment(appId, {
            arguments: args
        });
        this._appId = appId;
        return this;
    }
    async close() {
        if (this._appId != null) {
            try {
                // Since we wrap all spawn calls through powershell as well as from `open.openApp`, the returned ChildProcess is not the browser process.
                // And we cannot just call `process.kill()` kill it.
                // The implementation tries to find the pid of target chromium browser process (with --app=https://chrome-devtools-frontend.appspot.com in command arguments),
                // and uses taskkill to terminate the process.
                const env = await this.getPowershellEnv();
                await (0, _spawnAsync).default("powershell.exe", [
                    "-c",
                    `taskkill.exe /pid @(Get-WmiObject Win32_Process -Filter "name = '${this._appId}.exe' AND CommandLine LIKE '%chrome-devtools-frontend.appspot.com%'" | Select-Object -ExpandProperty ProcessId)`, 
                ], {
                    // @ts-expect-error: Missing NODE_ENV
                    env,
                    stdio: "ignore"
                });
            } catch  {}
            this._appId = undefined;
        }
    }
    /**
   * This method is used to get the powershell environment variables for `Get-Package` command.
   * Especially for powershell 7, its default `PSModulePath` is different from powershell 5 and `Get-Package` command is not available.
   * We need to set the PSModulePath to include the default value of powershell 5.
   */ async getPowershellEnv() {
        if (this._powershellEnv) {
            return this._powershellEnv;
        }
        const PSModulePath = (await (0, _spawnAsync).default("powershell.exe", [
            "-c",
            'echo "$PSHOME\\Modules"'
        ])).stdout.trim();
        this._powershellEnv = {
            PSModulePath
        };
        return this._powershellEnv;
    }
}
exports.default = LaunchBrowserImplWindows;
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const IS_WSL = require("is-wsl") && !require("is-docker")();
/**
 * Due to a bug in `open` on Windows PowerShell, we need to ensure `process.env.SYSTEMROOT` is set.
 * This environment variable is set by Windows on `SystemRoot`, causing `open` to execute a command with an "unknown" drive letter.
 *
 * @see https://github.com/sindresorhus/open/issues/205
 */ async function openWithSystemRootEnvironment(appId, options) {
    const oldSystemRoot = process.env.SYSTEMROOT;
    try {
        var _SYSTEMROOT;
        process.env.SYSTEMROOT = (_SYSTEMROOT = process.env.SYSTEMROOT) != null ? _SYSTEMROOT : process.env.SystemRoot;
        return await _open.default.openApp(appId, options);
    } finally{
        process.env.SYSTEMROOT = oldSystemRoot;
    }
}

//# sourceMappingURL=LaunchBrowserImplWindows.js.map