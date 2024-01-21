function fromUint8Array(uint8Array) {
    return new Buffer(uint8Array).toString('binary');
}

function toUint8Array(binaryStr) {
    return new Uint8Array(Buffer.from(binaryStr, 'binary'));
}

function fromBuffer(buffer) {
    return fromUint8Array(new Uint8Array(buffer));
}

function toBuffer(binaryStr) {
    return toUint8Array(binaryStr).buffer;
}

export { fromUint8Array, toUint8Array, fromBuffer, toBuffer };
//# sourceMappingURL=str2buf.mjs.map
