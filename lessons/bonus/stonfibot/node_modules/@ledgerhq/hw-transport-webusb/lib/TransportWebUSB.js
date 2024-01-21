"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _hwTransport = _interopRequireDefault(require("@ledgerhq/hw-transport"));

var _hidFraming = _interopRequireDefault(require("@ledgerhq/devices/lib/hid-framing"));

var _devices = require("@ledgerhq/devices");

var _logs = require("@ledgerhq/logs");

var _errors = require("@ledgerhq/errors");

var _webusb = require("./webusb");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const configurationValue = 1;
const endpointNumber = 3;
/**
 * WebUSB Transport implementation
 * @example
 * import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
 * ...
 * TransportWebUSB.create().then(transport => ...)
 */

class TransportWebUSB extends _hwTransport.default {
  constructor(device, interfaceNumber) {
    super();
    this.device = void 0;
    this.deviceModel = void 0;
    this.channel = Math.floor(Math.random() * 0xffff);
    this.packetSize = 64;
    this.interfaceNumber = void 0;
    this._disconnectEmitted = false;

    this._emitDisconnect = e => {
      if (this._disconnectEmitted) return;
      this._disconnectEmitted = true;
      this.emit("disconnect", e);
    };

    this.exchange = apdu => this.exchangeAtomicImpl(async () => {
      const {
        channel,
        packetSize
      } = this;
      (0, _logs.log)("apdu", "=> " + apdu.toString("hex"));
      const framing = (0, _hidFraming.default)(channel, packetSize); // Write...

      const blocks = framing.makeBlocks(apdu);

      for (let i = 0; i < blocks.length; i++) {
        await this.device.transferOut(endpointNumber, blocks[i]);
      } // Read...


      let result;
      let acc;

      while (!(result = framing.getReducedResult(acc))) {
        const r = await this.device.transferIn(endpointNumber, packetSize);
        const buffer = Buffer.from(r.data.buffer);
        acc = framing.reduceResponse(acc, buffer);
      }

      (0, _logs.log)("apdu", "<= " + result.toString("hex"));
      return result;
    }).catch(e => {
      if (e && e.message && e.message.includes("disconnected")) {
        this._emitDisconnect(e);

        throw new _errors.DisconnectedDeviceDuringOperation(e.message);
      }

      throw e;
    });

    this.device = device;
    this.interfaceNumber = interfaceNumber;
    this.deviceModel = (0, _devices.identifyUSBProductId)(device.productId);
  }
  /**
   * Check if WebUSB transport is supported.
   */


  /**
   * Similar to create() except it will always display the device permission (even if some devices are already accepted).
   */
  static async request() {
    const device = await (0, _webusb.requestLedgerDevice)();
    return TransportWebUSB.open(device);
  }
  /**
   * Similar to create() except it will never display the device permission (it returns a Promise<?Transport>, null if it fails to find a device).
   */


  static async openConnected() {
    const devices = await (0, _webusb.getLedgerDevices)();
    if (devices.length === 0) return null;
    return TransportWebUSB.open(devices[0]);
  }
  /**
   * Create a Ledger transport with a USBDevice
   */


  static async open(device) {
    await device.open();

    if (device.configuration === null) {
      await device.selectConfiguration(configurationValue);
    }

    await gracefullyResetDevice(device);
    const iface = device.configurations[0].interfaces.find(({
      alternates
    }) => alternates.some(a => a.interfaceClass === 255));

    if (!iface) {
      throw new _errors.TransportInterfaceNotAvailable("No WebUSB interface found for your Ledger device. Please upgrade firmware or contact techsupport.");
    }

    const interfaceNumber = iface.interfaceNumber;

    try {
      await device.claimInterface(interfaceNumber);
    } catch (e) {
      await device.close();
      throw new _errors.TransportInterfaceNotAvailable(e.message);
    }

    const transport = new TransportWebUSB(device, interfaceNumber);

    const onDisconnect = e => {
      if (device === e.device) {
        // $FlowFixMe
        navigator.usb.removeEventListener("disconnect", onDisconnect);

        transport._emitDisconnect(new _errors.DisconnectedDevice());
      }
    }; // $FlowFixMe


    navigator.usb.addEventListener("disconnect", onDisconnect);
    return transport;
  }

  /**
   * Release the transport device
   */
  async close() {
    await this.exchangeBusyPromise;
    await this.device.releaseInterface(this.interfaceNumber);
    await gracefullyResetDevice(this.device);
    await this.device.close();
  }
  /**
   * Exchange with the device using APDU protocol.
   * @param apdu
   * @returns a promise of apdu response
   */


  setScrambleKey() {}

}

exports.default = TransportWebUSB;
TransportWebUSB.isSupported = _webusb.isSupported;
TransportWebUSB.list = _webusb.getLedgerDevices;

TransportWebUSB.listen = observer => {
  let unsubscribed = false;
  (0, _webusb.getFirstLedgerDevice)().then(device => {
    if (!unsubscribed) {
      const deviceModel = (0, _devices.identifyUSBProductId)(device.productId);
      observer.next({
        type: "add",
        descriptor: device,
        deviceModel
      });
      observer.complete();
    }
  }, error => {
    if (window.DOMException && error instanceof window.DOMException && error.code === 18) {
      observer.error(new _errors.TransportWebUSBGestureRequired(error.message));
    } else {
      observer.error(new _errors.TransportOpenUserCancelled(error.message));
    }
  });

  function unsubscribe() {
    unsubscribed = true;
  }

  return {
    unsubscribe
  };
};

async function gracefullyResetDevice(device) {
  try {
    await device.reset();
  } catch (err) {
    console.warn(err);
  }
}
//# sourceMappingURL=TransportWebUSB.js.map