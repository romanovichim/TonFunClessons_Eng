"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.monitorCharacteristic = void 0;

var _rxjs = require("rxjs");

var _logs = require("@ledgerhq/logs");

const monitorCharacteristic = characteristic => _rxjs.Observable.create(o => {
  (0, _logs.log)("ble-verbose", "start monitor " + characteristic.uuid);

  function onCharacteristicValueChanged(event) {
    const characteristic = event.target;

    if (characteristic.value) {
      o.next(Buffer.from(characteristic.value.buffer));
    }
  }

  characteristic.startNotifications().then(() => {
    characteristic.addEventListener("characteristicvaluechanged", onCharacteristicValueChanged);
  });
  return () => {
    (0, _logs.log)("ble-verbose", "end monitor " + characteristic.uuid);
    characteristic.stopNotifications();
  };
});

exports.monitorCharacteristic = monitorCharacteristic;
//# sourceMappingURL=monitorCharacteristic.js.map