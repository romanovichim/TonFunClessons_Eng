/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { Config } from '@react-native-community/cli-types';
/**
 * Starts iOS device syslog tail
 */
type Args = {
    interactive: boolean;
};
declare function logIOS(_argv: Array<string>, _ctx: Config, args: Args): Promise<void>;
declare const _default: {
    name: string;
    description: string;
    func: typeof logIOS;
    options: {
        name: string;
        description: string;
    }[];
};
export default _default;
//# sourceMappingURL=index.d.ts.map