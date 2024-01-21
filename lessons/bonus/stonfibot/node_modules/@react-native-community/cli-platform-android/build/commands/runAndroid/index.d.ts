import { Config } from '@react-native-community/cli-types';
import adb from './adb';
import tryRunAdbReverse from './tryRunAdbReverse';
import getAdbPath from './getAdbPath';
import listAndroidDevices from './listAndroidDevices';
import { BuildFlags } from '../buildAndroid';
export interface Flags extends BuildFlags {
    appId: string;
    appIdSuffix: string;
    mainActivity?: string;
    port: number;
    terminal?: string;
    packager?: boolean;
    deviceId?: string;
    listDevices?: boolean;
    binaryPath?: string;
    user?: number | string;
}
export type AndroidProject = NonNullable<Config['project']['android']>;
/**
 * Starts the app on a connected Android emulator or device.
 */
declare function runAndroid(_argv: Array<string>, config: Config, args: Flags): Promise<void>;
declare const _default: {
    name: string;
    description: string;
    func: typeof runAndroid;
    options: ({
        name: string;
        description: string;
        parse?: undefined;
        default?: undefined;
    } | {
        name: string;
        description: string;
        parse: (val: string) => string[];
        default?: undefined;
    } | {
        name: string;
        description: string;
        default: boolean;
        parse?: undefined;
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
    } | {
        name: string;
        description: string;
        parse: NumberConstructor;
        default?: undefined;
    })[];
};
export default _default;
export { adb, getAdbPath, listAndroidDevices, tryRunAdbReverse };
//# sourceMappingURL=index.d.ts.map