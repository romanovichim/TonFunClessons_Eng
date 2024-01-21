type CacheKey = 'eTag' | 'lastChecked' | 'latestVersion' | 'dependencies';
/**
 * Returns the path string of `$HOME/.react-native-cli`.
 *
 * In case it doesn't exist, it will be created.
 */
declare function getCacheRootPath(): string;
declare function removeProjectCache(name: string): void;
declare function get(name: string, key: CacheKey): string | undefined;
declare function set(name: string, key: CacheKey, value: string): void;
declare const _default: {
    get: typeof get;
    set: typeof set;
    removeProjectCache: typeof removeProjectCache;
    getCacheRootPath: typeof getCacheRootPath;
};
export default _default;
//# sourceMappingURL=cacheManager.d.ts.map