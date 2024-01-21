import { Loader } from '../../types';
declare const logMessage: (message?: string) => void;
declare const logManualInstallation: ({ healthcheck, url, command, message, }: {
    healthcheck?: string | undefined;
    url?: string | undefined;
    command?: string | undefined;
    message?: string | undefined;
}) => void;
declare const logError: ({ healthcheck, loader, error, message, command, }: {
    healthcheck: string;
    loader?: import("ora").Ora | undefined;
    error: Error;
    message?: string | undefined;
    command: string;
}) => void;
declare function removeMessage(message: string): void;
/**
 * Inline a series of Ruby statements:
 *
 * In:
 *  puts "a"
 *  puts "b"
 *
 * Out:
 *  puts "a"; puts "b";
 */
declare function inline(strings: TemplateStringsArray, ...values: {
    toString(): string;
}[]): string;
export { logMessage, logManualInstallation, logError, removeMessage, inline };
//# sourceMappingURL=common.d.ts.map