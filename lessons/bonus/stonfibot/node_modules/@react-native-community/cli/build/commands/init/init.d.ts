import * as PackageManager from '../../tools/packageManager';
type Options = {
    template?: string;
    npm?: boolean;
    pm?: PackageManager.PackageManager;
    directory?: string;
    displayName?: string;
    title?: string;
    skipInstall?: boolean;
    version?: string;
    packageName?: string;
    installPods?: string | boolean;
    platformName?: string;
    skipGitInit?: boolean;
};
declare const _default: ([projectName]: Array<string>, options: Options) => Promise<void>;
export default _default;
//# sourceMappingURL=init.d.ts.map