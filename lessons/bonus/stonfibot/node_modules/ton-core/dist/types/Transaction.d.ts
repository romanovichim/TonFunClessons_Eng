/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
import { Builder } from "../boc/Builder";
import { Cell } from '../boc/Cell';
import { Slice } from "../boc/Slice";
import { Dictionary } from "../dict/Dictionary";
import { Maybe } from "../utils/maybe";
import { AccountStatus } from "./AccountStatus";
import { CurrencyCollection } from "./CurrencyCollection";
import { HashUpdate } from "./HashUpdate";
import { Message } from "./Message";
import { TransactionDescription } from "./TransactionDescription";
export type Transaction = {
    address: bigint;
    lt: bigint;
    prevTransactionHash: bigint;
    prevTransactionLt: bigint;
    now: number;
    outMessagesCount: number;
    oldStatus: AccountStatus;
    endStatus: AccountStatus;
    inMessage?: Maybe<Message>;
    outMessages: Dictionary<number, Message>;
    totalFees: CurrencyCollection;
    stateUpdate: HashUpdate;
    description: TransactionDescription;
    raw: Cell;
    hash: () => Buffer;
};
export declare function loadTransaction(slice: Slice): Transaction;
export declare function storeTransaction(src: Transaction): (builder: Builder) => void;
