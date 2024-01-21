"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _hwTransport = _interopRequireDefault(require("@ledgerhq/hw-transport"));

var _errors = require("@ledgerhq/errors");

var _devices = require("@ledgerhq/devices");

var _sendAPDU = require("@ledgerhq/devices/lib/ble/sendAPDU");

var _receiveAPDU = require("@ledgerhq/devices/lib/ble/receiveAPDU");

var _logs = require("@ledgerhq/logs");

var _rxjs = require("rxjs");

var _operators = require("rxjs/operators");

var _monitorCharacteristic = require("./monitorCharacteristic");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable prefer-template */
const requiresBluetooth = () => {
  // $FlowFixMe
  const {
    bluetooth
  } = navigator;

  if (typeof bluetooth === "undefined") {
    throw new Error("web bluetooth not supported");
  }

  return bluetooth;
};

const availability = () => _rxjs.Observable.create(observer => {
  const bluetooth = requiresBluetooth();

  const onAvailabilityChanged = e => {
    observer.next(e.value);
  };

  bluetooth.addEventListener("availabilitychanged", onAvailabilityChanged);
  let unsubscribed = false;
  bluetooth.getAvailability().then(available => {
    if (!unsubscribed) {
      observer.next(available);
    }
  });
  return () => {
    unsubscribed = true;
    bluetooth.removeEventListener("availabilitychanged", onAvailabilityChanged);
  };
});

const transportsCache = {};

const requestDeviceParam = () => ({
  filters: (0, _devices.getBluetoothServiceUuids)().map(uuid => ({
    services: [uuid]
  }))
});

const retrieveService = async device => {
  if (!device.gatt) throw new Error("bluetooth gatt not found");
  const [service] = await device.gatt.getPrimaryServices();
  if (!service) throw new Error("bluetooth service not found");
  const infos = (0, _devices.getInfosForServiceUuid)(service.uuid);
  if (!infos) throw new Error("bluetooth service infos not found");
  return [service, infos];
};

async function open(deviceOrId, needsReconnect) {
  let device;

  if (typeof deviceOrId === "string") {
    if (transportsCache[deviceOrId]) {
      (0, _logs.log)("ble-verbose", "Transport in cache, using that.");
      return transportsCache[deviceOrId];
    }

    const bluetooth = requiresBluetooth(); // TODO instead we should "query" the device by its ID

    device = await bluetooth.requestDevice(requestDeviceParam());
  } else {
    device = deviceOrId;
  }

  if (!device.gatt.connected) {
    (0, _logs.log)("ble-verbose", "not connected. connecting...");
    await device.gatt.connect();
  }

  const [service, infos] = await retrieveService(device);
  const {
    deviceModel,
    writeUuid,
    notifyUuid
  } = infos;
  const [writeC, notifyC] = await Promise.all([service.getCharacteristic(writeUuid), service.getCharacteristic(notifyUuid)]);
  const notifyObservable = (0, _monitorCharacteristic.monitorCharacteristic)(notifyC).pipe((0, _operators.tap)(value => {
    (0, _logs.log)("ble-frame", "<= " + value.toString("hex"));
  }), (0, _operators.share)());
  const notif = notifyObservable.subscribe();
  const transport = new BluetoothTransport(device, writeC, notifyObservable, deviceModel);

  if (!device.gatt.connected) {
    throw new _errors.DisconnectedDevice();
  } // eslint-disable-next-line require-atomic-updates


  transportsCache[transport.id] = transport;

  const onDisconnect = e => {
    console.log("onDisconnect!", e);
    delete transportsCache[transport.id];
    transport.notYetDisconnected = false;
    notif.unsubscribe();
    device.removeEventListener("gattserverdisconnected", onDisconnect);
    (0, _logs.log)("ble-verbose", `BleTransport(${transport.id}) disconnected`);
    transport.emit("disconnect", e);
  };

  device.addEventListener("gattserverdisconnected", onDisconnect);
  let beforeMTUTime = Date.now();

  try {
    await transport.inferMTU();
  } finally {
    let afterMTUTime = Date.now(); // workaround for #279: we need to open() again if we come the first time here,
    // to make sure we do a disconnect() after the first pairing time
    // because of a firmware bug

    if (afterMTUTime - beforeMTUTime < 1000) {
      needsReconnect = false; // (optim) there is likely no new pairing done because mtu answer was fast.
    }

    if (needsReconnect) {
      await device.gatt.disconnect(); // necessary time for the bonding workaround

      await new Promise(s => setTimeout(s, 4000));
    }
  }

  if (needsReconnect) {
    return open(device, false);
  }

  return transport;
}
/**
 * react-native bluetooth BLE implementation
 * @example
 * import BluetoothTransport from "@ledgerhq/hw-transport-web-ble";
 */


class BluetoothTransport extends _hwTransport.default {
  /**
   * observe event with { available: bool, type: string }
   * (available is generic, type is specific)
   * an event is emit once and then each time it changes
   */

  /**
   * Scan for Ledger Bluetooth devices.
   * On this web implementation, it only emits ONE device, the one that was selected in the UI (if any).
   */
  static listen(observer) {
    (0, _logs.log)("ble-verbose", "listen...");
    let unsubscribed;
    const bluetooth = requiresBluetooth();
    bluetooth.requestDevice(requestDeviceParam()).then(async device => {
      if (!unsubscribed) {
        observer.next({
          type: "add",
          descriptor: device
        });
        observer.complete();
      }
    }, error => {
      observer.error(new _errors.TransportOpenUserCancelled(error.message));
    });

    function unsubscribe() {
      unsubscribed = true;
    }

    return {
      unsubscribe
    };
  }
  /**
   * open a bluetooth device.
   */


  static async open(deviceOrId) {
    return open(deviceOrId, true);
  }
  /**
   * globally disconnect a bluetooth device by its id.
   */


  constructor(device, writeCharacteristic, notifyObservable, deviceModel) {
    super();
    this.id = void 0;
    this.device = void 0;
    this.mtuSize = 20;
    this.writeCharacteristic = void 0;
    this.notifyObservable = void 0;
    this.notYetDisconnected = true;
    this.deviceModel = void 0;

    this.exchange = apdu => this.exchangeAtomicImpl(async () => {
      try {
        const msgIn = apdu.toString("hex");
        (0, _logs.log)("apdu", `=> ${msgIn}`);
        const data = await (0, _rxjs.merge)(this.notifyObservable.pipe(_receiveAPDU.receiveAPDU), (0, _sendAPDU.sendAPDU)(this.write, apdu, this.mtuSize)).toPromise();
        const msgOut = data.toString("hex");
        (0, _logs.log)("apdu", `<= ${msgOut}`);
        return data;
      } catch (e) {
        (0, _logs.log)("ble-error", "exchange got " + String(e));

        if (this.notYetDisconnected) {
          // in such case we will always disconnect because something is bad.
          this.device.gatt.disconnect();
        }

        throw e;
      }
    });

    this.write = async buffer => {
      (0, _logs.log)("ble-frame", "=> " + buffer.toString("hex"));
      await this.writeCharacteristic.writeValue(buffer);
    };

    this.id = device.id;
    this.device = device;
    this.writeCharacteristic = writeCharacteristic;
    this.notifyObservable = notifyObservable;
    this.deviceModel = deviceModel;
    (0, _logs.log)("ble-verbose", `BleTransport(${String(this.id)}) new instance`);
  }

  async inferMTU() {
    let mtu = 23;
    await this.exchangeAtomicImpl(async () => {
      try {
        mtu = (await (0, _rxjs.merge)(this.notifyObservable.pipe((0, _operators.first)(buffer => buffer.readUInt8(0) === 0x08), (0, _operators.map)(buffer => buffer.readUInt8(5))), (0, _rxjs.defer)(() => (0, _rxjs.from)(this.write(Buffer.from([0x08, 0, 0, 0, 0])))).pipe((0, _operators.ignoreElements)())).toPromise()) + 3;
      } catch (e) {
        (0, _logs.log)("ble-error", "inferMTU got " + String(e));
        this.device.gatt.disconnect();
        throw e;
      }
    });

    if (mtu > 23) {
      const mtuSize = mtu - 3;
      (0, _logs.log)("ble-verbose", `BleTransport(${String(this.id)}) mtu set to ${String(mtuSize)}`);
      this.mtuSize = mtuSize;
    }

    return this.mtuSize;
  }
  /**
   * Exchange with the device using APDU protocol.
   * @param apdu
   * @returns a promise of apdu response
   */


  setScrambleKey() {}

  async close() {
    if (this.exchangeBusyPromise) {
      await this.exchangeBusyPromise;
    }
  }

}

exports.default = BluetoothTransport;

BluetoothTransport.isSupported = () => Promise.resolve().then(requiresBluetooth).then(() => true, () => false);

BluetoothTransport.observeAvailability = observer => availability.subscribe(observer);

BluetoothTransport.list = () => Promise.resolve([]);

BluetoothTransport.disconnect = async id => {
  (0, _logs.log)("ble-verbose", `user disconnect(${id})`);
  const transport = transportsCache[id];

  if (transport) {
    transport.device.gatt.disconnect();
  }
};
//# sourceMappingURL=TransportWebBLE.js.map