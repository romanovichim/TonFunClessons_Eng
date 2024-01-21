import { IOSProjectInfo } from '@react-native-community/cli-types';
import type { BuildFlags } from './buildOptions';
export declare function getConfiguration(xcodeProject: IOSProjectInfo, sourceDir: string, args: BuildFlags): Promise<{
    scheme: string;
    mode: string;
}>;
//# sourceMappingURL=getConfiguration.d.ts.map