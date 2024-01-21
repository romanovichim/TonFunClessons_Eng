/**
 * A custom Error that creates a single-lined message to match current styling inside CLI.
 * Uses original stack trace when `originalError` is passed or erase the stack if it's not defined.
 */
export declare class CLIError extends Error {
    constructor(msg: string, originalError?: Error | string);
}
/**
 * Raised when we're unable to find a package.json
 */
export declare class UnknownProjectError extends Error {
}
export declare const inlineString: (str?: string) => string;
//# sourceMappingURL=errors.d.ts.map