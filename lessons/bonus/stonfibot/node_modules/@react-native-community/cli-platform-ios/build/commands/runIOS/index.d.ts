/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { Config } from '@react-native-community/cli-types';
import { BuildFlags } from '../buildIOS/buildOptions';
export interface FlagsT extends BuildFlags {
    simulator?: string;
    device?: string | true;
    udid?: string;
    binaryPath?: string;
    listDevices?: boolean;
    packager?: boolean;
    port: number;
    terminal?: string;
}
declare function runIOS(_: Array<string>, ctx: Config, args: FlagsT): Promise<void>;
declare const _default: {
    name: string;
    description: string;
    func: typeof runIOS;
    examples: {
        desc: string;
        cmd: string;
    }[];
    options: ({
        name: string;
        description: string;
        parse?: undefined;
    } | {
        name: string;
        description: string;
        parse: (val: string) => string[];
    } | {
        name: string;
        default: string | number;
        parse: NumberConstructor;
        description?: undefined;
    } | {
        name: string;
        description: string;
        default: string | undefined;
        parse?: undefined;
    })[];
};
export default _default;
//# sourceMappingURL=index.d.ts.map