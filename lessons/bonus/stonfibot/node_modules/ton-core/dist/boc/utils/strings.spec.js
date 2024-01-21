"use strict";
/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const _helpers_1 = require("../../types/_helpers");
const strings_1 = require("./strings");
describe('strings', () => {
    let cases = [
        ['123'],
        ['12345678901234567890123456789012345678901234567890123456789012345678901234567890'],
        ['привет мир 👀 привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀']
    ];
    it.each(cases)('should serialize and parse strings', (c) => {
        let cell = (0, strings_1.stringToCell)(c);
        expect((0, strings_1.readString)(cell.beginParse())).toEqual(c);
    });
    it.each(cases)('should serialize and parse string with padded slice', (c) => {
        let cell = (0, _helpers_1.comment)(c);
        expect((0, strings_1.readString)(cell.beginParse().skip(32))).toEqual(c);
    });
});
