function r(r){return new Buffer(r).toString("binary")}function n(r){return new Uint8Array(Buffer.from(r,"binary"))}function t(n){return r(new Uint8Array(n))}function f(r){return n(r).buffer}exports.fromUint8Array=r,exports.toUint8Array=n,exports.fromBuffer=t,exports.toBuffer=f;
//# sourceMappingURL=str2buf.js.map
