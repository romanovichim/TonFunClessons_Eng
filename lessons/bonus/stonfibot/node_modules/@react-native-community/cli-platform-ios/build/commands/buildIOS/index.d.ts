/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { Config } from '@react-native-community/cli-types';
import { BuildFlags } from './buildOptions';
declare function buildIOS(_: Array<string>, ctx: Config, args: BuildFlags): Promise<string>;
declare const _default: {
    name: string;
    description: string;
    func: typeof buildIOS;
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
    })[];
};
export default _default;
//# sourceMappingURL=index.d.ts.map