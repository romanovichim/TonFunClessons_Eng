import { Config } from '@react-native-community/cli-types';
import { MetroBundleOptions } from './metroBundleOptions';
/**
 * Generate a sourcemap by fetching it from a running metro server
 */
export declare function generateSourcemap(port: string, bundleOptions: MetroBundleOptions): Promise<string | undefined>;
/**
 *
 * @param ctx
 */
export declare function findSourcemap(ctx: Config, port: string, bundleOptions: MetroBundleOptions): Promise<string | undefined>;
//# sourceMappingURL=sourcemapUtils.d.ts.map