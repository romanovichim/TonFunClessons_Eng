import { SemVer } from 'semver';
import { Release } from './getLatestRelease';
/**
 * Logs out a message if the user's version is behind a stable version of React Native
 */
export declare function logIfUpdateAvailable(projectRoot: string): Promise<void>;
type Update = {
    upgrade?: Release;
    current: string;
    name: string;
};
/**
 * Finds the latest stables version of React Native > current version
 */
export declare function latest(projectRoot: string): Promise<Update | undefined>;
/**
 * Gets the current project's version parsed as Semver
 */
export declare function current(projectRoot: string): SemVer | undefined;
export {};
//# sourceMappingURL=index.d.ts.map