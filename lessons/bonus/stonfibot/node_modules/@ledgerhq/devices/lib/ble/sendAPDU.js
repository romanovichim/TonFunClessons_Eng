"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sendAPDU = void 0;

var _rxjs = require("rxjs");

var _logs = require("@ledgerhq/logs");

const TagId = 0x05;

function chunkBuffer(buffer, sizeForIndex) {
  const chunks = [];

  for (let i = 0, size = sizeForIndex(0); i < buffer.length; i += size, size = sizeForIndex(i)) {
    chunks.push(buffer.slice(i, i + size));
  }

  return chunks;
}

const sendAPDU = (write, apdu, mtuSize) => {
  const chunks = chunkBuffer(apdu, i => mtuSize - (i === 0 ? 5 : 3)).map((buffer, i) => {
    const head = Buffer.alloc(i === 0 ? 5 : 3);
    head.writeUInt8(TagId, 0);
    head.writeUInt16BE(i, 1);

    if (i === 0) {
      head.writeUInt16BE(apdu.length, 3);
    }

    return Buffer.concat([head, buffer]);
  });
  return _rxjs.Observable.create(o => {
    let terminated = false;

    async function main() {
      for (const chunk of chunks) {
        if (terminated) return;
        await write(chunk);
      }
    }

    main().then(() => {
      terminated = true;
      o.complete();
    }, e => {
      terminated = true;
      (0, _logs.log)("ble-error", "sendAPDU failure " + String(e));
      o.error(e);
    });

    const unsubscribe = () => {
      if (!terminated) {
        (0, _logs.log)("ble-verbose", "sendAPDU interruption");
        terminated = true;
      }
    };

    return unsubscribe;
  });
};

exports.sendAPDU = sendAPDU;
//# sourceMappingURL=sendAPDU.js.map