"use strict";
/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserializeInternalKey = exports.serializeInternalKey = void 0;
const Address_1 = require("../../address/Address");
const BitString_1 = require("../../boc/BitString");
const paddedBits_1 = require("../../boc/utils/paddedBits");
function serializeInternalKey(value) {
    if (typeof value === 'number') {
        if (!Number.isSafeInteger(value)) {
            throw Error('Invalid key type: not a safe integer: ' + value);
        }
        return 'n:' + value.toString(10);
    }
    else if (typeof value === 'bigint') {
        return 'b:' + value.toString(10);
    }
    else if (Address_1.Address.isAddress(value)) {
        return 'a:' + value.toString();
    }
    else if (Buffer.isBuffer(value)) {
        return 'f:' + value.toString('hex');
    }
    else if (BitString_1.BitString.isBitString(value)) {
        return 'B:' + value.toString();
    }
    else {
        throw Error('Invalid key type');
    }
}
exports.serializeInternalKey = serializeInternalKey;
function deserializeInternalKey(value) {
    let k = value.slice(0, 2);
    let v = value.slice(2);
    if (k === 'n:') {
        return parseInt(v, 10);
    }
    else if (k === 'b:') {
        return BigInt(v);
    }
    else if (k === 'a:') {
        return Address_1.Address.parse(v);
    }
    else if (k === 'f:') {
        return Buffer.from(v, 'hex');
    }
    else if (k === 'B:') {
        const lastDash = v.slice(-1) == "_";
        const isPadded = lastDash || v.length % 2 != 0;
        if (isPadded) {
            let charLen = lastDash ? v.length - 1 : v.length;
            const padded = v.substr(0, charLen) + "0"; //Padding
            if ((!lastDash) && ((charLen & 1) !== 0)) {
                // Four bit nibmle without padding
                return new BitString_1.BitString(Buffer.from(padded, 'hex'), 0, charLen << 2);
            }
            else {
                return (0, paddedBits_1.paddedBufferToBits)(Buffer.from(padded, 'hex'));
            }
        }
        else {
            return new BitString_1.BitString(Buffer.from(v, 'hex'), 0, v.length << 2);
        }
    }
    throw Error('Invalid key type: ' + k);
}
exports.deserializeInternalKey = deserializeInternalKey;
