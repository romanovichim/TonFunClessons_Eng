"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _child_process() {
  const data = _interopRequireDefault(require("child_process"));
  _child_process = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _fs() {
  const data = _interopRequireDefault(require("fs"));
  _fs = function () {
    return data;
  };
  return data;
}
function _chalk() {
  const data = _interopRequireDefault(require("chalk"));
  _chalk = function () {
    return data;
  };
  return data;
}
var _getDestinationSimulator = require("../../tools/getDestinationSimulator");
function _cliTools() {
  const data = require("@react-native-community/cli-tools");
  _cliTools = function () {
    return data;
  };
  return data;
}
var _buildProject = require("../buildIOS/buildProject");
var _buildOptions = require("../buildIOS/buildOptions");
var _getConfiguration = require("../buildIOS/getConfiguration");
var _listIOSDevices = _interopRequireDefault(require("../../tools/listIOSDevices"));
var _prompts = require("../../tools/prompts");
var _getSimulators = _interopRequireDefault(require("../../tools/getSimulators"));
var _getXcodeProjectAndDir = require("../buildIOS/getXcodeProjectAndDir");
var _pods = _interopRequireDefault(require("../../tools/pods"));
var _getArchitecture = _interopRequireDefault(require("../../tools/getArchitecture"));
var _findXcodeProject = _interopRequireDefault(require("../../config/findXcodeProject"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

async function runIOS(_, ctx, args) {
  var _ctx$project$ios;
  _cliTools().link.setPlatform('ios');
  let {
    packager,
    port
  } = args;
  let installedPods = false;
  // check if pods need to be installed
  if (((_ctx$project$ios = ctx.project.ios) === null || _ctx$project$ios === void 0 ? void 0 : _ctx$project$ios.automaticPodsInstallation) || args.forcePods) {
    var _ctx$project$ios2, _ctx$project$ios3;
    const isAppRunningNewArchitecture = ((_ctx$project$ios2 = ctx.project.ios) === null || _ctx$project$ios2 === void 0 ? void 0 : _ctx$project$ios2.sourceDir) ? await (0, _getArchitecture.default)((_ctx$project$ios3 = ctx.project.ios) === null || _ctx$project$ios3 === void 0 ? void 0 : _ctx$project$ios3.sourceDir) : undefined;
    await (0, _pods.default)(ctx.root, ctx.dependencies, {
      forceInstall: args.forcePods,
      newArchEnabled: isAppRunningNewArchitecture
    });
    installedPods = true;
  }
  if (packager) {
    const {
      port: newPort,
      startPackager
    } = await (0, _cliTools().findDevServerPort)(port, ctx.root);
    if (startPackager) {
      await (0, _cliTools().startServerInNewWindow)(newPort, ctx.root, ctx.reactNativePath, args.terminal);
    }
  }
  if (ctx.reactNativeVersion !== 'unknown') {
    _cliTools().link.setVersion(ctx.reactNativeVersion);
  }
  let {
    xcodeProject,
    sourceDir
  } = (0, _getXcodeProjectAndDir.getXcodeProjectAndDir)(ctx.project.ios);

  // if project is freshly created, revisit Xcode project to verify Pods are installed correctly.
  // This is needed because ctx project is created before Pods are installed, so it might have outdated information.
  if (installedPods) {
    const recheckXcodeProject = (0, _findXcodeProject.default)(_fs().default.readdirSync(sourceDir));
    if (recheckXcodeProject) {
      xcodeProject = recheckXcodeProject;
    }
  }
  process.chdir(sourceDir);
  if (args.binaryPath) {
    args.binaryPath = _path().default.isAbsolute(args.binaryPath) ? args.binaryPath : _path().default.join(ctx.root, args.binaryPath);
    if (!_fs().default.existsSync(args.binaryPath)) {
      throw new (_cliTools().CLIError)('binary-path was specified, but the file was not found.');
    }
  }
  const {
    mode,
    scheme
  } = await (0, _getConfiguration.getConfiguration)(xcodeProject, sourceDir, args);
  const devices = await (0, _listIOSDevices.default)();
  const availableDevices = devices.filter(({
    isAvailable
  }) => isAvailable === true);
  if (availableDevices.length === 0) {
    return _cliTools().logger.error('iOS devices or simulators not detected. Install simulators via Xcode or connect a physical iOS device');
  }
  if (args.listDevices || args.interactive) {
    if (args.device || args.udid) {
      _cliTools().logger.warn(`Both ${args.device ? 'device' : 'udid'} and "list-devices" parameters were passed to "run" command. We will list available devices and let you choose from one.`);
    }
    const selectedDevice = await (0, _prompts.promptForDeviceSelection)(availableDevices);
    if (!selectedDevice) {
      throw new (_cliTools().CLIError)(`Failed to select device, please try to run app without ${args.listDevices ? 'list-devices' : 'interactive'} command.`);
    }
    if (selectedDevice.type === 'simulator') {
      return runOnSimulator(xcodeProject, mode, scheme, args, selectedDevice);
    } else {
      return runOnDevice(selectedDevice, mode, scheme, xcodeProject, args);
    }
  }
  if (!args.device && !args.udid && !args.simulator) {
    const bootedDevices = availableDevices.filter(({
      type
    }) => type === 'device');
    const simulators = (0, _getSimulators.default)();
    const bootedSimulators = Object.keys(simulators.devices).map(key => simulators.devices[key]).reduce((acc, val) => acc.concat(val), []).filter(({
      state
    }) => state === 'Booted');
    const booted = [...bootedDevices, ...bootedSimulators];
    if (booted.length === 0) {
      _cliTools().logger.info('No booted devices or simulators found. Launching first available simulator...');
      return runOnSimulator(xcodeProject, mode, scheme, args);
    }
    _cliTools().logger.info(`Found booted ${booted.map(({
      name
    }) => name).join(', ')}`);
    return runOnBootedDevicesSimulators(mode, scheme, xcodeProject, args, bootedDevices, bootedSimulators);
  }
  if (args.device && args.udid) {
    return _cliTools().logger.error('The `device` and `udid` options are mutually exclusive.');
  }
  if (args.udid) {
    const device = availableDevices.find(d => d.udid === args.udid);
    if (!device) {
      return _cliTools().logger.error(`Could not find a device with udid: "${_chalk().default.bold(args.udid)}". ${printFoundDevices(availableDevices)}`);
    }
    if (device.type === 'simulator') {
      return runOnSimulator(xcodeProject, mode, scheme, args);
    } else {
      return runOnDevice(device, mode, scheme, xcodeProject, args);
    }
  } else if (args.device) {
    const physicalDevices = availableDevices.filter(({
      type
    }) => type !== 'simulator');
    const device = matchingDevice(physicalDevices, args.device);
    if (device) {
      return runOnDevice(device, mode, scheme, xcodeProject, args);
    }
  } else {
    runOnSimulator(xcodeProject, mode, scheme, args);
  }
}
async function runOnBootedDevicesSimulators(mode, scheme, xcodeProject, args, devices, simulators) {
  for (const device of devices) {
    await runOnDevice(device, mode, scheme, xcodeProject, args);
  }
  for (const simulator of simulators) {
    await runOnSimulator(xcodeProject, mode, scheme, args, simulator);
  }
}
async function runOnSimulator(xcodeProject, mode, scheme, args, simulator) {
  /**
   * If provided simulator does not exist, try simulators in following order
   * - iPhone 14
   * - iPhone 13
   * - iPhone 12
   * - iPhone 11
   */

  let selectedSimulator;
  if (simulator) {
    selectedSimulator = simulator;
  } else {
    const fallbackSimulators = ['iPhone 14', 'iPhone 13', 'iPhone 12', 'iPhone 11'];
    selectedSimulator = (0, _getDestinationSimulator.getDestinationSimulator)(args, fallbackSimulators);
  }
  if (!selectedSimulator) {
    throw new (_cliTools().CLIError)(`No simulator available with ${args.simulator ? `name "${args.simulator}"` : `udid "${args.udid}"`}`);
  }

  /**
   * Booting simulator through `xcrun simctl boot` will boot it in the `headless` mode
   * (running in the background).
   *
   * In order for user to see the app and the simulator itself, we have to make sure
   * that the Simulator.app is running.
   *
   * We also pass it `-CurrentDeviceUDID` so that when we launch it for the first time,
   * it will not boot the "default" device, but the one we set. If the app is already running,
   * this flag has no effect.
   */
  const activeDeveloperDir = _child_process().default.execFileSync('xcode-select', ['-p'], {
    encoding: 'utf8'
  }).trim();
  _child_process().default.execFileSync('open', [`${activeDeveloperDir}/Applications/Simulator.app`, '--args', '-CurrentDeviceUDID', selectedSimulator.udid]);
  if (selectedSimulator.state !== 'Booted') {
    bootSimulator(selectedSimulator);
  }
  let buildOutput, appPath;
  if (!args.binaryPath) {
    buildOutput = await (0, _buildProject.buildProject)(xcodeProject, selectedSimulator.udid, mode, scheme, args);
    appPath = await getBuildPath(xcodeProject, mode, buildOutput, scheme, args.target);
  } else {
    appPath = args.binaryPath;
  }
  _cliTools().logger.info(`Installing "${_chalk().default.bold(appPath)} on ${selectedSimulator.name}"`);
  _child_process().default.spawnSync('xcrun', ['simctl', 'install', selectedSimulator.udid, appPath], {
    stdio: 'inherit'
  });
  const bundleID = _child_process().default.execFileSync('/usr/libexec/PlistBuddy', ['-c', 'Print:CFBundleIdentifier', _path().default.join(appPath, 'Info.plist')], {
    encoding: 'utf8'
  }).trim();
  _cliTools().logger.info(`Launching "${_chalk().default.bold(bundleID)}"`);
  const result = _child_process().default.spawnSync('xcrun', ['simctl', 'launch', selectedSimulator.udid, bundleID]);
  if (result.status === 0) {
    _cliTools().logger.success('Successfully launched the app on the simulator');
  } else {
    _cliTools().logger.error('Failed to launch the app on simulator', result.stderr.toString());
  }
}
async function runOnDevice(selectedDevice, mode, scheme, xcodeProject, args) {
  if (args.binaryPath && selectedDevice.type === 'catalyst') {
    throw new (_cliTools().CLIError)('binary-path was specified for catalyst device, which is not supported.');
  }
  const isIOSDeployInstalled = _child_process().default.spawnSync('ios-deploy', ['--version'], {
    encoding: 'utf8'
  });
  if (isIOSDeployInstalled.error) {
    throw new (_cliTools().CLIError)(`Failed to install the app on the device because we couldn't execute the "ios-deploy" command. Please install it by running "${_chalk().default.bold('brew install ios-deploy')}" and try again.`);
  }
  if (selectedDevice.type === 'catalyst') {
    const buildOutput = await (0, _buildProject.buildProject)(xcodeProject, selectedDevice.udid, mode, scheme, args);
    const appPath = await getBuildPath(xcodeProject, mode, buildOutput, scheme, args.target, true);
    const appProcess = _child_process().default.spawn(`${appPath}/${scheme}`, [], {
      detached: true,
      stdio: 'ignore'
    });
    appProcess.unref();
  } else {
    let buildOutput, appPath;
    if (!args.binaryPath) {
      buildOutput = await (0, _buildProject.buildProject)(xcodeProject, selectedDevice.udid, mode, scheme, args);
      appPath = await getBuildPath(xcodeProject, mode, buildOutput, scheme, args.target);
    } else {
      appPath = args.binaryPath;
    }
    const iosDeployInstallArgs = ['--bundle', appPath, '--id', selectedDevice.udid, '--justlaunch'];
    _cliTools().logger.info(`Installing and launching your app on ${selectedDevice.name}`);
    const iosDeployOutput = _child_process().default.spawnSync('ios-deploy', iosDeployInstallArgs, {
      encoding: 'utf8'
    });
    if (iosDeployOutput.error) {
      throw new (_cliTools().CLIError)(`Failed to install the app on the device. We've encountered an error in "ios-deploy" command: ${iosDeployOutput.error.message}`);
    }
  }
  return _cliTools().logger.success('Installed the app on the device.');
}
function bootSimulator(selectedSimulator) {
  const simulatorFullName = formattedDeviceName(selectedSimulator);
  _cliTools().logger.info(`Launching ${simulatorFullName}`);
  _child_process().default.spawnSync('xcrun', ['simctl', 'boot', selectedSimulator.udid]);
}
async function getTargetPaths(buildSettings, scheme, target) {
  const settings = JSON.parse(buildSettings);
  const targets = settings.map(({
    target: settingsTarget
  }) => settingsTarget);
  let selectedTarget = targets[0];
  if (target) {
    if (!targets.includes(target)) {
      _cliTools().logger.info(`Target ${_chalk().default.bold(target)} not found for scheme ${_chalk().default.bold(scheme)}, automatically selected target ${_chalk().default.bold(selectedTarget)}`);
    } else {
      selectedTarget = target;
    }
  }

  // Find app in all building settings - look for WRAPPER_EXTENSION: 'app',

  const targetIndex = targets.indexOf(selectedTarget);
  const wrapperExtension = settings[targetIndex].buildSettings.WRAPPER_EXTENSION;
  if (wrapperExtension === 'app') {
    return {
      targetBuildDir: settings[targetIndex].buildSettings.TARGET_BUILD_DIR,
      executableFolderPath: settings[targetIndex].buildSettings.EXECUTABLE_FOLDER_PATH
    };
  }
  return {};
}
async function getBuildPath(xcodeProject, mode, buildOutput, scheme, target, isCatalyst = false) {
  const buildSettings = _child_process().default.execFileSync('xcodebuild', [xcodeProject.isWorkspace ? '-workspace' : '-project', xcodeProject.name, '-scheme', scheme, '-sdk', getPlatformName(buildOutput), '-configuration', mode, '-showBuildSettings', '-json'], {
    encoding: 'utf8'
  });
  const {
    targetBuildDir,
    executableFolderPath
  } = await getTargetPaths(buildSettings, scheme, target);
  if (!targetBuildDir) {
    throw new (_cliTools().CLIError)('Failed to get the target build directory.');
  }
  if (!executableFolderPath) {
    throw new (_cliTools().CLIError)('Failed to get the app name.');
  }
  return `${targetBuildDir}${isCatalyst ? '-maccatalyst' : ''}/${executableFolderPath}`;
}
function getPlatformName(buildOutput) {
  // Xcode can sometimes escape `=` with a backslash or put the value in quotes
  const platformNameMatch = /export PLATFORM_NAME\\?="?(\w+)"?$/m.exec(buildOutput);
  if (!platformNameMatch) {
    throw new (_cliTools().CLIError)('Couldn\'t find "PLATFORM_NAME" variable in xcodebuild output. Please report this issue and run your project with Xcode instead.');
  }
  return platformNameMatch[1];
}
function matchingDevice(devices, deviceName) {
  if (deviceName === true) {
    const firstIOSDevice = devices.find(d => d.type === 'device');
    if (firstIOSDevice) {
      _cliTools().logger.info(`Using first available device named "${_chalk().default.bold(firstIOSDevice.name)}" due to lack of name supplied.`);
      return firstIOSDevice;
    } else {
      _cliTools().logger.error('No iOS devices connected.');
      return undefined;
    }
  }
  const deviceByName = devices.find(device => device.name === deviceName || formattedDeviceName(device) === deviceName);
  if (!deviceByName) {
    _cliTools().logger.error(`Could not find a device named: "${_chalk().default.bold(String(deviceName))}". ${printFoundDevices(devices)}`);
  }
  return deviceByName;
}
function formattedDeviceName(simulator) {
  return simulator.version ? `${simulator.name} (${simulator.version})` : simulator.name;
}
function printFoundDevices(devices) {
  return ['Available devices:', ...devices.map(device => `  - ${device.name} (${device.udid})`)].join('\n');
}
var _default = {
  name: 'run-ios',
  description: 'builds your app and starts it on iOS simulator',
  func: runIOS,
  examples: [{
    desc: 'Run on a different simulator, e.g. iPhone SE (2nd generation)',
    cmd: 'npx react-native run-ios --simulator "iPhone SE (2nd generation)"'
  }, {
    desc: "Run on a connected device, e.g. Max's iPhone",
    cmd: 'npx react-native run-ios --device "Max\'s iPhone"'
  }, {
    desc: 'Run on the AppleTV simulator',
    cmd: 'npx react-native run-ios --simulator "Apple TV"  --scheme "helloworld-tvOS"'
  }],
  options: [..._buildOptions.buildOptions, {
    name: '--no-packager',
    description: 'Do not launch packager while running the app'
  }, {
    name: '--port <number>',
    default: process.env.RCT_METRO_PORT || 8081,
    parse: Number
  }, {
    name: '--terminal <string>',
    description: 'Launches the Metro Bundler in a new window using the specified terminal path.',
    default: (0, _cliTools().getDefaultUserTerminal)()
  }, {
    name: '--binary-path <string>',
    description: 'Path relative to project root where pre-built .app binary lives.'
  }, {
    name: '--list-devices',
    description: 'List all available iOS devices and simulators and let you choose one to run the app. '
  }, {
    name: '--simulator <string>',
    description: 'Explicitly set the simulator to use. Optionally set the iOS version ' + 'between parentheses at the end to match an exact version: ' + '"iPhone 15 (17.0)"'
  }, {
    name: '--device <string>',
    description: 'Explicitly set the device to use by name. The value is not required ' + 'if you have a single device connected.'
  }, {
    name: '--udid <string>',
    description: 'Explicitly set the device to use by UDID'
  }]
};
exports.default = _default;

//# sourceMappingURL=index.ts.map