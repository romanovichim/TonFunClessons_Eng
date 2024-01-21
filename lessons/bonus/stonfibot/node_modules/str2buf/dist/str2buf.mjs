function fromUint8Array(uint8Array) {
    var binary = '';
    for (var b = 0, bl = uint8Array.length;b < bl; b++) {
        binary += String.fromCharCode(uint8Array[b]);
    }
    return binary;
}

function toUint8Array(binaryStr) {
    var uint8Array = new Uint8Array(binaryStr.length);
    for (var s = 0, sl = binaryStr.length;s < sl; s++) {
        uint8Array[s] = binaryStr.charCodeAt(s);
    }
    return uint8Array;
}

function fromBuffer(buffer) {
    return fromUint8Array(new Uint8Array(buffer));
}

function toBuffer(binaryStr) {
    return toUint8Array(binaryStr).buffer;
}

export { fromUint8Array, toUint8Array, fromBuffer, toBuffer };
//# sourceMappingURL=str2buf.mjs.map
