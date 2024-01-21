/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {beginCell} from "../boc/Builder";
import {
    loadOutAction,
    loadOutList,
    OutAction,
    OutActionSendMsg,
    OutActionSetCode,
    storeOutAction,
    storeOutList
} from "./OutList";
import {SendMode} from "./SendMode";
import {MessageRelaxed, storeMessageRelaxed} from "./MessageRelaxed";

const mockMessageRelaxed1: MessageRelaxed = {
    info: {
        type: 'external-out',
        createdLt: 0n,
        createdAt: 0,
        dest: null,
        src: null
    },
    body: beginCell().storeUint(0,8).endCell(),
    init: null
}

const mockMessageRelaxed2: MessageRelaxed = {
    info: {
        type: 'external-out',
        createdLt: 1n,
        createdAt: 1,
        dest: null,
        src: null
    },
    body: beginCell().storeUint(1,8).endCell(),
    init: null
}

const mockSetCodeCell = beginCell().storeUint(123, 8).endCell();

describe('Out List', () => {
    const outActionSendMsgTag = 0x0ec3c86d;
    const outActionSetCodeTag = 0xad4de08e;

    it('Should serialise sendMsg action', () => {
        const mode = SendMode.PAY_GAS_SEPARATELY;
        const action = storeOutAction({
            type: 'sendMsg',
            mode,
            outMsg: mockMessageRelaxed1
        }) ;

        const actual = beginCell().store(action).endCell();

        const expected = beginCell()
            .storeUint(outActionSendMsgTag, 32)
            .storeUint(mode, 8)
            .storeRef(beginCell().store(storeMessageRelaxed(mockMessageRelaxed1)).endCell())
            .endCell();
        expect(expected.equals(actual)).toBeTruthy();
    });

    it('Should serialise setCode action', () => {
        const action = storeOutAction({
            type: 'setCode',
            newCode: mockSetCodeCell
        });

        const actual = beginCell().store(action).endCell();

        const expected = beginCell()
            .storeUint(outActionSetCodeTag, 32)
            .storeRef(mockSetCodeCell)
            .endCell();
        expect(expected.equals(actual)).toBeTruthy();
    });

    it('Should deserialize sendMsg action', () => {
        const mode = SendMode.PAY_GAS_SEPARATELY;
        const action = beginCell()
            .storeUint(outActionSendMsgTag, 32)
            .storeUint(mode, 8)
            .storeRef(beginCell().store(storeMessageRelaxed(mockMessageRelaxed1)).endCell())
            .endCell();

        const actual = loadOutAction(action.beginParse()) as OutActionSendMsg;

        const expected = {
            type: 'sendMsg',
            mode,
            outMsg: mockMessageRelaxed1
        };

        expect(expected.type).toEqual(actual.type);
        expect(expected.mode).toEqual(actual.mode);
        expect(expected.outMsg.body.equals(actual.outMsg.body)).toBeTruthy();
        expect(expected.outMsg.init).toEqual(actual.outMsg.init);
        expect(expected.outMsg.info).toEqual(actual.outMsg.info);
    });

    it('Should deserialize setCode action', () => {
        const action = beginCell()
            .storeUint(outActionSetCodeTag, 32)
            .storeRef(mockSetCodeCell)
            .endCell();

        const actual = loadOutAction(action.beginParse()) as OutActionSetCode;

        const expected = {
            type: 'setCode',
            newCode: mockSetCodeCell
        };

        expect(expected.type).toEqual(actual.type);
        expect(expected.newCode.equals(actual.newCode)).toBeTruthy();
    });

    it('Should serialize out list', () => {
        const sendMode1 = SendMode.PAY_GAS_SEPARATELY;
        const sendMode2 = SendMode.IGNORE_ERRORS;

        const actions: OutAction[] = [
            {
                type: 'sendMsg',
                mode: sendMode1,
                outMsg: mockMessageRelaxed1
            },
            {
                type: 'sendMsg',
                mode: sendMode2,
                outMsg: mockMessageRelaxed2
            },
            {
                type: 'setCode',
                newCode: mockSetCodeCell
            }
        ]

        const actual = beginCell().store(storeOutList(actions)).endCell();

        // tvm handles actions from c5 in reversed order
        const expected =
            beginCell()
                .storeRef(
                    beginCell()
                        .storeRef(
                            beginCell()
                                .storeRef(beginCell().endCell())
                                .storeUint(outActionSendMsgTag, 32)
                                .storeUint(sendMode1, 8)
                                .storeRef(beginCell().store(storeMessageRelaxed(mockMessageRelaxed1)).endCell())
                                .endCell()
                        )
                        .storeUint(outActionSendMsgTag, 32)
                        .storeUint(sendMode2, 8)
                        .storeRef(beginCell().store(storeMessageRelaxed(mockMessageRelaxed2)).endCell())
                        .endCell()
                )
                .storeUint(outActionSetCodeTag, 32)
                .storeRef(mockSetCodeCell)
                .endCell()



        expect(actual.equals(expected)).toBeTruthy();
    });

    it('Should deserialize out list', () => {
        const outActionSendMsgTag = 0x0ec3c86d;
        const outActionSetCodeTag = 0xad4de08e;

        const sendMode1 = SendMode.PAY_GAS_SEPARATELY;
        const sendMode2 = SendMode.IGNORE_ERRORS;

        const expected: OutAction[] = [
            {
                type: 'sendMsg',
                mode: sendMode1,
                outMsg: mockMessageRelaxed1
            },
            {
                type: 'sendMsg',
                mode: sendMode2,
                outMsg: mockMessageRelaxed2
            },
            {
                type: 'setCode',
                newCode: mockSetCodeCell
            }
        ]

        const rawList =
            beginCell()
                .storeRef(
                    beginCell()
                        .storeRef(
                            beginCell()
                                .storeRef(beginCell().endCell())
                                .storeUint(outActionSendMsgTag, 32)
                                .storeUint(sendMode1, 8)
                                .storeRef(beginCell().store(storeMessageRelaxed(mockMessageRelaxed1)).endCell())
                                .endCell()
                        )
                        .storeUint(outActionSendMsgTag, 32)
                        .storeUint(sendMode2, 8)
                        .storeRef(beginCell().store(storeMessageRelaxed(mockMessageRelaxed2)).endCell())
                        .endCell()
                )
                .storeUint(outActionSetCodeTag, 32)
                .storeRef(mockSetCodeCell)
                .endCell()

        const actual = loadOutList(rawList.beginParse());

        expect(expected.length).toEqual(actual.length);
        expected.forEach((item1, index) => {
            const item2 = actual[index];
            expect(item1.type).toEqual(item2.type);

            if (item1.type === 'sendMsg' && item2.type === 'sendMsg') {
                expect(item1.mode).toEqual(item2.mode);
                expect(item1.outMsg.body.equals(item2.outMsg.body)).toBeTruthy();
                expect(item1.outMsg.info).toEqual(item2.outMsg.info);
                expect(item1.outMsg.init).toEqual(item2.outMsg.init);
            }

            if (item1.type === 'setCode' && item2.type === 'setCode') {
                expect(item1.newCode.equals(item2.newCode)).toBeTruthy();
            }
        })

    });
});
