"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getInfosForServiceUuid = exports.getBluetoothServiceUuids = exports.identifyProductName = exports.identifyUSBProductId = exports.getDeviceModel = exports.ledgerUSBVendorId = exports.IIWebUSB = exports.IICCID = exports.IIU2F = exports.IIKeyboardHID = exports.IIGenericHID = void 0;

var _semver = _interopRequireDefault(require("semver"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * The USB product IDs will be defined as MMII, encoding a model (MM) and an interface bitfield (II)
 *
 ** Model
 * Ledger Nano S : 0x10
 * Ledger Blue : 0x00
 * Ledger Nano X : 0x40
 *
 ** Interface support bitfield
 * Generic HID : 0x01
 * Keyboard HID : 0x02
 * U2F : 0x04
 * CCID : 0x08
 * WebUSB : 0x10
 */
const IIGenericHID = 0x01;
exports.IIGenericHID = IIGenericHID;
const IIKeyboardHID = 0x02;
exports.IIKeyboardHID = IIKeyboardHID;
const IIU2F = 0x04;
exports.IIU2F = IIU2F;
const IICCID = 0x08;
exports.IICCID = IICCID;
const IIWebUSB = 0x10;
exports.IIWebUSB = IIWebUSB;
const devices = {
  blue: {
    id: "blue",
    productName: "Ledger Blue",
    productIdMM: 0x00,
    legacyUsbProductId: 0x0000,
    usbOnly: true,
    memorySize: 480 * 1024,
    blockSize: 4 * 1024,
    getBlockSize: _firwareVersion => 4 * 1024
  },
  nanoS: {
    id: "nanoS",
    productName: "Ledger Nano S",
    productIdMM: 0x10,
    legacyUsbProductId: 0x0001,
    usbOnly: true,
    memorySize: 320 * 1024,
    blockSize: 4 * 1024,
    getBlockSize: firmwareVersion => _semver.default.lt(_semver.default.coerce(firmwareVersion), "2.0.0") ? 4 * 1024 : 2 * 1024
  },
  nanoX: {
    id: "nanoX",
    productName: "Ledger Nano X",
    productIdMM: 0x40,
    legacyUsbProductId: 0x0004,
    usbOnly: false,
    memorySize: 2 * 1024 * 1024,
    blockSize: 4 * 1024,
    getBlockSize: _firwareVersion => 4 * 1024,
    bluetoothSpec: [{
      // this is the legacy one (prototype version). we will eventually drop it.
      serviceUuid: "d973f2e0-b19e-11e2-9e96-0800200c9a66",
      notifyUuid: "d973f2e1-b19e-11e2-9e96-0800200c9a66",
      writeUuid: "d973f2e2-b19e-11e2-9e96-0800200c9a66"
    }, {
      serviceUuid: "13d63400-2c97-0004-0000-4c6564676572",
      notifyUuid: "13d63400-2c97-0004-0001-4c6564676572",
      writeUuid: "13d63400-2c97-0004-0002-4c6564676572"
    }]
  }
};
const productMap = {
  Blue: "blue",
  "Nano S": "nanoS",
  "Nano X": "nanoX"
}; // $FlowFixMe

const devicesList = Object.values(devices);
/**
 *
 */

const ledgerUSBVendorId = 0x2c97;
/**
 *
 */

exports.ledgerUSBVendorId = ledgerUSBVendorId;

const getDeviceModel = id => {
  const info = devices[id];
  if (!info) throw new Error("device '" + id + "' does not exist");
  return info;
};
/**
 *
 */


exports.getDeviceModel = getDeviceModel;

const identifyUSBProductId = usbProductId => {
  const legacy = devicesList.find(d => d.legacyUsbProductId === usbProductId);
  if (legacy) return legacy;
  const mm = usbProductId >> 8;
  const deviceModel = devicesList.find(d => d.productIdMM === mm);
  return deviceModel;
};

exports.identifyUSBProductId = identifyUSBProductId;

const identifyProductName = productName => {
  const productId = productMap[productName];
  const deviceModel = devicesList.find(d => d.id === productId);
  return deviceModel;
};

exports.identifyProductName = identifyProductName;
const bluetoothServices = [];
const serviceUuidToInfos = {};

for (let id in devices) {
  const deviceModel = devices[id];
  const {
    bluetoothSpec
  } = deviceModel;

  if (bluetoothSpec) {
    for (let i = 0; i < bluetoothSpec.length; i++) {
      const spec = bluetoothSpec[i];
      bluetoothServices.push(spec.serviceUuid);
      serviceUuidToInfos[spec.serviceUuid] = serviceUuidToInfos[spec.serviceUuid.replace(/-/g, "")] = _objectSpread({
        deviceModel
      }, spec);
    }
  }
}
/**
 *
 */


const getBluetoothServiceUuids = () => bluetoothServices;
/**
 *
 */


exports.getBluetoothServiceUuids = getBluetoothServiceUuids;

const getInfosForServiceUuid = uuid => serviceUuidToInfos[uuid.toLowerCase()];
/**
 *
 */


exports.getInfosForServiceUuid = getInfosForServiceUuid;
//# sourceMappingURL=index.js.map