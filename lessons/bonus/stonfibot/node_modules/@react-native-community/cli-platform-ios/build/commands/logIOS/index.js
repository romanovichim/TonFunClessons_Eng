"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _child_process() {
  const data = require("child_process");
  _child_process = function () {
    return data;
  };
  return data;
}
function _os() {
  const data = _interopRequireDefault(require("os"));
  _os = function () {
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
function _cliTools() {
  const data = require("@react-native-community/cli-tools");
  _cliTools = function () {
    return data;
  };
  return data;
}
var _listIOSDevices = _interopRequireDefault(require("../../tools/listIOSDevices"));
var _getSimulators = _interopRequireDefault(require("../../tools/getSimulators"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Starts iOS device syslog tail
 */

async function logIOS(_argv, _ctx, args) {
  // Here we're using two command because first command `xcrun simctl list --json devices` outputs `state` but doesn't return `available`. But second command `xcrun xcdevice list` outputs `available` but doesn't output `state`. So we need to connect outputs of both commands.
  const simulators = (0, _getSimulators.default)();
  const bootedSimulators = Object.keys(simulators.devices).map(key => simulators.devices[key]).reduce((acc, val) => acc.concat(val), []).filter(({
    state
  }) => state === 'Booted');
  const devices = await (0, _listIOSDevices.default)();
  const availableSimulators = devices.filter(({
    type,
    isAvailable
  }) => type === 'simulator' && isAvailable);
  if (availableSimulators.length === 0) {
    _cliTools().logger.error('No simulators detected. Install simulators via Xcode.');
    return;
  }
  const bootedAndAvailableSimulators = bootedSimulators.map(booted => {
    const available = availableSimulators.find(({
      udid
    }) => udid === booted.udid);
    return {
      ...available,
      ...booted
    };
  });
  if (bootedAndAvailableSimulators.length === 0) {
    _cliTools().logger.error('No booted and available iOS simulators found.');
    return;
  }
  if (args.interactive && bootedAndAvailableSimulators.length > 1) {
    const {
      udid
    } = await (0, _cliTools().prompt)({
      type: 'select',
      name: 'udid',
      message: 'Select iOS simulators to tail logs from',
      choices: bootedAndAvailableSimulators.map(simulator => ({
        title: simulator.name,
        value: simulator.udid
      }))
    });
    tailDeviceLogs(udid);
  } else {
    tailDeviceLogs(bootedAndAvailableSimulators[0].udid);
  }
}
function tailDeviceLogs(udid) {
  const logDir = _path().default.join(_os().default.homedir(), 'Library', 'Logs', 'CoreSimulator', udid, 'asl');
  const log = (0, _child_process().spawnSync)('syslog', ['-w', '-F', 'std', '-d', logDir], {
    stdio: 'inherit'
  });
  if (log.error !== null) {
    throw log.error;
  }
}
var _default = {
  name: 'log-ios',
  description: 'starts iOS device syslog tail',
  func: logIOS,
  options: [{
    name: '--interactive',
    description: 'Explicitly select simulator to tail logs from. By default it will tail logs from the first booted and available simulator.'
  }]
};
exports.default = _default;

//# sourceMappingURL=index.ts.map