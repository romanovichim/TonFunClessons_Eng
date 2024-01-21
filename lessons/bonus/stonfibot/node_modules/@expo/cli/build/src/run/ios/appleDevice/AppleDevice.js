"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getConnectedDevicesAsync = getConnectedDevicesAsync;
exports.runOnDevice = runOnDevice;
exports.launchAppWithDeviceCtl = launchAppWithDeviceCtl;
var _debug = _interopRequireDefault(require("debug"));
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _clientManager = require("./ClientManager");
var _lockdowndClient = require("./client/LockdowndClient");
var _usbmuxdClient = require("./client/UsbmuxdClient");
var _afcprotocol = require("./protocol/AFCProtocol");
var _log = require("../../../log");
var _xcodeDeveloperDiskImagePrerequisite = require("../../../start/doctor/apple/XcodeDeveloperDiskImagePrerequisite");
var _xcrun = require("../../../start/platforms/ios/xcrun");
var _delay = require("../../../utils/delay");
var _errors = require("../../../utils/errors");
var _exit = require("../../../utils/exit");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const debug = (0, _debug).default("expo:apple-device");
async function getConnectedDevicesAsync() {
    const client = new _usbmuxdClient.UsbmuxdClient(_usbmuxdClient.UsbmuxdClient.connectUsbmuxdSocket());
    const devices = await client.getDevices();
    client.socket.end();
    return Promise.all(devices.map(async (device)=>{
        const socket = await new _usbmuxdClient.UsbmuxdClient(_usbmuxdClient.UsbmuxdClient.connectUsbmuxdSocket()).connect(device, 62078);
        const deviceValues = await new _lockdowndClient.LockdowndClient(socket).getAllValues();
        socket.end();
        var _DeviceName, ref;
        // TODO(EvanBacon): Add support for osType (ipad, watchos, etc)
        return {
            // TODO(EvanBacon): Better name
            name: (ref = (_DeviceName = deviceValues.DeviceName) != null ? _DeviceName : deviceValues.ProductType) != null ? ref : "unknown iOS device",
            model: deviceValues.ProductType,
            osVersion: deviceValues.ProductVersion,
            deviceType: "device",
            connectionType: device.Properties.ConnectionType,
            udid: device.Properties.SerialNumber
        };
    }));
}
async function runOnDevice({ udid , appPath , bundleId , waitForApp , deltaPath , onProgress  }) {
    const clientManager = await _clientManager.ClientManager.create(udid);
    try {
        await mountDeveloperDiskImage(clientManager);
        const packageName = _path.default.basename(appPath);
        const destPackagePath = _path.default.join("PublicStaging", packageName);
        await uploadApp(clientManager, {
            appBinaryPath: appPath,
            destinationPath: destPackagePath
        });
        const installer = await clientManager.getInstallationProxyClient();
        await installer.installApp(destPackagePath, bundleId, {
            // https://github.com/ios-control/ios-deploy/blob/0f2ffb1e564aa67a2dfca7cdf13de47ce489d835/src/ios-deploy/ios-deploy.m#L2491-L2508
            ApplicationsType: "Any",
            CFBundleIdentifier: bundleId,
            CloseOnInvalidate: "1",
            InvalidateOnDetach: "1",
            IsUserInitiated: "1",
            // Disable checking for wifi devices, this is nominally faster.
            PreferWifi: "0",
            // Only info I could find on these:
            // https://github.com/wwxxyx/Quectel_BG96/blob/310876f90fc1093a59e45e381160eddcc31697d0/Apple_Homekit/homekit_certification_tools/ATS%206/ATS%206/ATS.app/Contents/Frameworks/CaptureKit.framework/Versions/A/Resources/MobileDevice/MobileInstallation.h#L112-L121
            PackageType: "Developer",
            ShadowParentKey: deltaPath
        }, onProgress);
        const { // TODO(EvanBacon): This can be undefined when querying App Clips.
        [bundleId]: appInfo ,  } = await installer.lookupApp([
            bundleId
        ]);
        if (appInfo) {
            // launch fails with EBusy or ENotFound if you try to launch immediately after install
            await (0, _delay).delayAsync(200);
            const debugServerClient = await launchApp(clientManager, {
                bundleId,
                appInfo,
                detach: !waitForApp
            });
            if (waitForApp && debugServerClient) {
                (0, _exit).installExitHooks(async ()=>{
                    // causes continue() to return
                    debugServerClient.halt();
                    // give continue() time to return response
                    await (0, _delay).delayAsync(64);
                });
                debug(`Waiting for app to close...\n`);
                const result = await debugServerClient.continue();
                // TODO: I have no idea what this packet means yet (successful close?)
                // if not a close (ie, most likely due to halt from onBeforeExit), then kill the app
                if (result !== "W00") {
                    await debugServerClient.kill();
                }
            }
        } else {
            _log.Log.warn(`App "${bundleId}" installed but couldn't be launched. Open on device manually.`);
        }
    } finally{
        clientManager.end();
    }
}
/** Mount the developer disk image for Xcode. */ async function mountDeveloperDiskImage(clientManager) {
    const imageMounter = await clientManager.getMobileImageMounterClient();
    // Check if already mounted. If not, mount.
    if (!(await imageMounter.lookupImage()).ImageSignature) {
        // verify DeveloperDiskImage exists (TODO: how does this work on Windows/Linux?)
        // TODO: if windows/linux, download?
        const version = await (await clientManager.getLockdowndClient()).getValue("ProductVersion");
        const developerDiskImagePath = await _xcodeDeveloperDiskImagePrerequisite.XcodeDeveloperDiskImagePrerequisite.instance.assertAsync({
            version
        });
        const developerDiskImageSig = _fs.default.readFileSync(`${developerDiskImagePath}.signature`);
        await imageMounter.uploadImage(developerDiskImagePath, developerDiskImageSig);
        await imageMounter.mountImage(developerDiskImagePath, developerDiskImageSig);
    }
}
async function uploadApp(clientManager, { appBinaryPath , destinationPath  }) {
    const afcClient = await clientManager.getAFCClient();
    try {
        await afcClient.getFileInfo("PublicStaging");
    } catch (err) {
        if (err instanceof _afcprotocol.AFCError && err.status === _afcprotocol.AFC_STATUS.OBJECT_NOT_FOUND) {
            await afcClient.makeDirectory("PublicStaging");
        } else {
            throw err;
        }
    }
    await afcClient.uploadDirectory(appBinaryPath, destinationPath);
}
async function launchAppWithUsbmux(clientManager, { appInfo , detach  }) {
    let tries = 0;
    while(tries < 3){
        const debugServerClient = await clientManager.getDebugserverClient();
        await debugServerClient.setMaxPacketSize(1024);
        await debugServerClient.setWorkingDir(appInfo.Container);
        await debugServerClient.launchApp(appInfo.Path, appInfo.CFBundleExecutable);
        const result = await debugServerClient.checkLaunchSuccess();
        if (result === "OK") {
            if (detach) {
                // https://github.com/libimobiledevice/libimobiledevice/blob/25059d4c7d75e03aab516af2929d7c6e6d4c17de/tools/idevicedebug.c#L455-L464
                const res = await debugServerClient.sendCommand("D", []);
                debug("Disconnect from debug server request:", res);
                if (res !== "OK") {
                    console.warn("Something went wrong while attempting to disconnect from iOS debug server, you may need to reopen the app manually.");
                }
            }
            return debugServerClient;
        } else if (result === "EBusy" || result === "ENotFound") {
            debug("Device busy or app not found, trying to launch again in .5s...");
            tries++;
            debugServerClient.socket.end();
            await (0, _delay).delayAsync(500);
        } else {
            throw new _errors.CommandError(`There was an error launching app: ${result}`);
        }
    }
    throw new _errors.CommandError("Unable to launch app, number of tries exceeded");
}
async function launchAppWithDeviceCtl(deviceId, bundleId) {
    try {
        await (0, _xcrun).xcrunAsync([
            "devicectl",
            "device",
            "process",
            "launch",
            "--device",
            deviceId,
            bundleId
        ]);
    } catch (error) {
        if ("stderr" in error) {
            const errorCodes = getDeviceCtlErrorCodes(error.stderr);
            if (errorCodes.includes("Locked")) {
                throw new _errors.CommandError("APPLE_DEVICE_LOCKED", "Device is locked, unlock and try again.");
            }
        }
        throw new _errors.CommandError(`There was an error launching app: ${error}`);
    }
}
/** Find all error codes from the output log */ function getDeviceCtlErrorCodes(log) {
    return [
        ...log.matchAll(/BSErrorCodeDescription\s+=\s+(.*)$/gim)
    ].map(([_line, code])=>code
    );
}
/**
 * iOS 17 introduces a new protocol called RemoteXPC.
 * This is not yet implemented, so we fallback to devicectl.
 *
 * @see https://github.com/doronz88/pymobiledevice3/blob/master/misc/RemoteXPC.md#process-remoted
 */ async function launchApp(clientManager, { bundleId , appInfo , detach  }) {
    try {
        return await launchAppWithUsbmux(clientManager, {
            appInfo,
            detach
        });
    } catch (error) {
        debug("Failed to launch app with Usbmuxd, falling back to xcrun...", error);
        // Get the device UDID and close the connection, to allow `xcrun devicectl` to connect
        const deviceId = clientManager.device.Properties.SerialNumber;
        clientManager.end();
        // Fallback to devicectl for iOS 17 support
        return await launchAppWithDeviceCtl(deviceId, bundleId);
    }
}

//# sourceMappingURL=AppleDevice.js.map