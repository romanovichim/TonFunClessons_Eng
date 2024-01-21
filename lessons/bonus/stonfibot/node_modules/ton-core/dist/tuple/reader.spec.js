"use strict";
/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const reader_1 = require("./reader");
const fs_1 = __importDefault(require("fs"));
describe('tuple', () => {
    it('should read cons', () => {
        const cons = [
            {
                "type": "tuple",
                "items": [
                    { "type": "int", "value": BigInt(1) },
                    {
                        "type": "tuple",
                        "items": [
                            { "type": "int", "value": BigInt(2) },
                            {
                                "type": "tuple",
                                "items": [
                                    { "type": "int", "value": BigInt(3) },
                                    { "type": "null" }
                                ]
                            }
                        ]
                    }
                ]
            }
        ];
        const r = new reader_1.TupleReader(cons);
        const items = [
            {
                "type": "int",
                "value": BigInt(1)
            },
            {
                "type": "int",
                "value": BigInt(2)
            },
            {
                "type": "int",
                "value": BigInt(3)
            },
        ];
        expect(r.readLispList()).toEqual(items);
    });
    it('should read ultra deep cons', () => {
        let fContent = fs_1.default.readFileSync('./src/tuple/ultra_deep_cons.json');
        const cons = JSON.parse(fContent.toString());
        const result = [];
        for (let index = 0; index < 187; index++) {
            if (![11, 82, 116, 154].includes(index)) {
                result.push({ "type": "int", "value": index.toString() });
            }
        }
        expect(new reader_1.TupleReader(cons).readLispList()).toEqual(result);
    });
    it('should raise error on nontuple element in chain', () => {
        const cons = [
            {
                "type": "int",
                "value": BigInt(1)
            }
        ];
        const r = new reader_1.TupleReader(cons);
        expect(() => r.readLispListDirect()).toThrowError('Lisp list consists only from (any, tuple) elements');
    });
    it('should return empty list if tuple is null', () => {
        const cons = [
            {
                type: 'null'
            }
        ];
        let r = new reader_1.TupleReader(cons);
        expect(r.readLispList()).toEqual([]);
        r = new reader_1.TupleReader(cons);
        expect(r.readLispListDirect()).toEqual([]);
    });
});
