"use strict";
/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.paddedBufferToBits = exports.bitsToPaddedBuffer = void 0;
const BitBuilder_1 = require("../BitBuilder");
const BitString_1 = require("../BitString");
function bitsToPaddedBuffer(bits) {
    // Create builder
    let builder = new BitBuilder_1.BitBuilder(Math.ceil(bits.length / 8) * 8);
    builder.writeBits(bits);
    // Apply padding
    let padding = Math.ceil(bits.length / 8) * 8 - bits.length;
    for (let i = 0; i < padding; i++) {
        if (i === 0) {
            builder.writeBit(1);
        }
        else {
            builder.writeBit(0);
        }
    }
    return builder.buffer();
}
exports.bitsToPaddedBuffer = bitsToPaddedBuffer;
function paddedBufferToBits(buff) {
    let bitLen = 0;
    // Finding rightmost non-zero byte in the buffer
    for (let i = buff.length - 1; i >= 0; i--) {
        if (buff[i] !== 0) {
            const testByte = buff[i];
            // Looking for a rightmost set padding bit
            let bitPos = testByte & -testByte;
            if ((bitPos & 1) == 0) {
                // It's power of 2 (only one bit set)
                bitPos = Math.log2(bitPos) + 1;
            }
            if (i > 0) {
                // If we are dealing with more than 1 byte buffer
                bitLen = i << 3; //Number of full bytes * 8
            }
            bitLen += 8 - bitPos;
            break;
        }
    }
    return new BitString_1.BitString(buff, 0, bitLen);
}
exports.paddedBufferToBits = paddedBufferToBits;
