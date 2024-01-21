type Platforms = 'android' | 'ios' | 'inherit' | 'none';
export declare function getOS(): string;
interface Overrides {
    os?: string;
    hash?: string;
    version?: string;
}
interface Other {
    [key: string]: string;
}
export declare const docs: (path: string, platform: Platforms, hashOrOverrides?: string | (Overrides & Other) | undefined) => string;
export declare const contributing: (path: string, platform: Platforms, hashOrOverrides?: string | (Overrides & Other) | undefined) => string;
export declare const community: (path: string, platform: Platforms, hashOrOverrides?: string | (Overrides & Other) | undefined) => string;
export declare const showcase: (path: string, platform: Platforms, hashOrOverrides?: string | (Overrides & Other) | undefined) => string;
export declare const blog: (path: string, platform: Platforms, hashOrOverrides?: string | (Overrides & Other) | undefined) => string;
/**
 * When the user builds, we should define the target platform globally.
 */
export declare function setPlatform(target: Platforms): void;
/**
 * Can we figure out what version of react native they're using?
 */
export declare function setVersion(reactNativeVersion: string): void;
export {};
//# sourceMappingURL=doclink.d.ts.map