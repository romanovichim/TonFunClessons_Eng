/**
 * Copyright (c) Whales Corp. 
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { comment } from '../../types/_helpers';
import { readString, stringToCell } from "./strings";

describe('strings', () => {
    let cases: string[][] = [
        ['123'],
        ['12345678901234567890123456789012345678901234567890123456789012345678901234567890'],
        ['привет мир 👀 привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀привет мир 👀']
    ];

    it.each(cases)('should serialize and parse strings', (c) => {
        let cell = stringToCell(c);
        expect(readString(cell.beginParse())).toEqual(c);
    });

    it.each(cases)('should serialize and parse string with padded slice', (c) => {
        let cell = comment(c);
        
        expect(readString(cell.beginParse().skip(32))).toEqual(c);
    })
});