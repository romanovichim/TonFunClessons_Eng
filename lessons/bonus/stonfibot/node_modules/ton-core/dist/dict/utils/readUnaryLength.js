"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readUnaryLength = void 0;
function readUnaryLength(slice) {
    let res = 0;
    while (slice.loadBit()) {
        res++;
    }
    return res;
}
exports.readUnaryLength = readUnaryLength;
