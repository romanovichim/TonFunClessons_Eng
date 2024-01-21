import { DependencyConfig } from '@react-native-community/cli-types';
interface ResolvePodsOptions {
    forceInstall?: boolean;
    newArchEnabled?: boolean;
}
interface NativeDependencies {
    [key: string]: DependencyConfig;
}
export declare function getPackageJson(root: string): any;
export declare function getIosDependencies(dependencies: NativeDependencies): string[];
export declare function dependenciesToString(dependencies: string[]): string;
export declare function generateMd5Hash(text: string): string;
export declare function compareMd5Hashes(hash1: string, hash2: string): boolean;
export default function resolvePods(root: string, nativeDependencies: NativeDependencies, options?: ResolvePodsOptions): Promise<void>;
export {};
//# sourceMappingURL=pods.d.ts.map