import execa from 'execa';
export type PackageManager = keyof typeof packageManagers;
type Options = {
    packageManager: PackageManager;
    silent?: boolean;
    root: string;
};
declare const packageManagers: {
    yarn: {
        init: string[];
        install: string[];
        installDev: string[];
        uninstall: string[];
        installAll: string[];
    };
    npm: {
        init: string[];
        install: string[];
        installDev: string[];
        uninstall: string[];
        installAll: string[];
    };
    bun: {
        init: string[];
        install: string[];
        installDev: string[];
        uninstall: string[];
        installAll: string[];
    };
};
export declare function executeCommand(command: string, args: Array<string>, options: {
    root: string;
    silent?: boolean;
}): execa.ExecaChildProcess<string>;
export declare function shouldUseYarn(options: Options): string | null | undefined;
export declare function shouldUseBun(options: Options): string | null | undefined;
export declare function shouldUseNpm(options: Options): string | null | undefined;
export declare function init(options: Options): execa.ExecaChildProcess<string>;
export declare function install(packageNames: Array<string>, options: Options): execa.ExecaChildProcess<string>;
export declare function installDev(packageNames: Array<string>, options: Options): execa.ExecaChildProcess<string>;
export declare function uninstall(packageNames: Array<string>, options: Options): execa.ExecaChildProcess<string>;
export declare function installAll(options: Options): execa.ExecaChildProcess<string>;
export {};
//# sourceMappingURL=packageManager.d.ts.map