"use strict";
/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const convert_1 = require("./convert");
const stringCases = [
    { real: '1', nano: '1000000000' },
    { real: '10', nano: '10000000000' },
    { real: '0.1', nano: '100000000' },
    { real: '0.33', nano: '330000000' },
    { real: '0.000000001', nano: '1' },
    { real: '10.000000001', nano: '10000000001' },
    { real: '1000000.000000001', nano: '1000000000000001' },
    { real: '100000000000', nano: '100000000000000000000' },
];
const numberCases = [
    { real: -0, nano: '0' },
    { real: 0, nano: '0' },
    { real: 1e64, nano: '10000000000000000000000000000000000000000000000000000000000000000000000000' },
    { real: 1, nano: '1000000000' },
    { real: 10, nano: '10000000000' },
    { real: 0.1, nano: '100000000' },
    { real: 0.33, nano: '330000000' },
    { real: 0.000000001, nano: '1' },
    { real: 10.000000001, nano: '10000000001' },
    { real: 1000000.000000001, nano: '1000000000000001' },
    { real: 100000000000, nano: '100000000000000000000' },
];
describe('convert', () => {
    it('should throw an error for NaN', () => {
        expect(() => (0, convert_1.toNano)(NaN)).toThrow();
    });
    it('should throw an error for Infinity', () => {
        expect(() => (0, convert_1.toNano)(Infinity)).toThrow();
    });
    it('should throw an error for -Infinity', () => {
        expect(() => (0, convert_1.toNano)(-Infinity)).toThrow();
    });
    it('should throw an error due to insufficient precision of number', () => {
        expect(() => (0, convert_1.toNano)(10000000.000000001)).toThrow();
    });
    it('should convert numbers toNano', () => {
        for (let r of numberCases) {
            let c = (0, convert_1.toNano)(r.real);
            expect(c).toBe(BigInt(r.nano));
        }
    });
    it('should convert strings toNano', () => {
        for (let r of stringCases) {
            let c = (0, convert_1.toNano)(r.real);
            expect(c).toBe(BigInt(r.nano));
        }
    });
    it('should convert fromNano', () => {
        for (let r of stringCases) {
            let c = (0, convert_1.fromNano)(r.nano);
            expect(c).toEqual(r.real);
        }
    });
});
