import type { Ora } from 'ora';
interface PodInstallOptions {
    skipBundleInstall?: boolean;
    newArchEnabled?: boolean;
    iosFolderPath?: string;
}
declare function installCocoaPods(loader: Ora): Promise<Ora>;
declare function installPods(loader?: Ora, options?: PodInstallOptions): Promise<void>;
export { installCocoaPods };
export default installPods;
//# sourceMappingURL=installPods.d.ts.map