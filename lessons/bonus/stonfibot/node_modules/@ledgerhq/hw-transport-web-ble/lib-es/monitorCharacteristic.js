import { Observable } from "rxjs";
import { log } from "@ledgerhq/logs";
export const monitorCharacteristic = characteristic => Observable.create(o => {
  log("ble-verbose", "start monitor " + characteristic.uuid);

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
    log("ble-verbose", "end monitor " + characteristic.uuid);
    characteristic.stopNotifications();
  };
});
//# sourceMappingURL=monitorCharacteristic.js.map