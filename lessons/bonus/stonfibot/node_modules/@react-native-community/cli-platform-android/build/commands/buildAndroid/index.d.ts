import { Config } from '@react-native-community/cli-types';
export interface BuildFlags {
    mode?: string;
    activeArchOnly?: boolean;
    tasks?: Array<string>;
    extraParams?: Array<string>;
    interactive?: boolean;
}
declare function buildAndroid(_argv: Array<string>, config: Config, args: BuildFlags): Promise<void>;
export declare function build(gradleArgs: string[], sourceDir: string): void;
export declare const options: ({
    name: string;
    description: string;
    parse?: undefined;
    default?: undefined;
} | {
    name: string;
    description: string;
    parse: (val: string) => string[];
    default?: undefined;
} | {
    name: string;
    description: string;
    default: boolean;
    parse?: undefined;
})[];
declare const _default: {
    name: string;
    description: string;
    func: typeof buildAndroid;
    options: ({
        name: string;
        description: string;
        parse?: undefined;
        default?: undefined;
    } | {
        name: string;
        description: string;
        parse: (val: string) => string[];
        default?: undefined;
    } | {
        name: string;
        description: string;
        default: boolean;
        parse?: undefined;
    })[];
};
export default _default;
//# sourceMappingURL=index.d.ts.map