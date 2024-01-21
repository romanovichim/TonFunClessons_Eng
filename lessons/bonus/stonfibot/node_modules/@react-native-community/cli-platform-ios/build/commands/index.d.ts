declare const _default: ({
    name: string;
    description: string;
    func: (_argv: string[], _ctx: import("@react-native-community/cli-types").Config, args: {
        interactive: boolean;
    }) => Promise<void>;
    options: {
        name: string;
        description: string;
    }[];
} | {
    name: string;
    description: string;
    func: (_: string[], ctx: import("@react-native-community/cli-types").Config, args: import("./runIOS").FlagsT) => Promise<void>;
    examples: {
        desc: string;
        cmd: string;
    }[];
    options: ({
        name: string;
        description: string;
        parse?: undefined;
    } | {
        name: string;
        description: string;
        parse: (val: string) => string[];
    } | {
        name: string;
        default: string | number;
        parse: NumberConstructor;
        description?: undefined;
    } | {
        name: string;
        description: string;
        default: string | undefined;
        parse?: undefined;
    })[];
} | {
    name: string;
    description: string;
    func: (_: string[], ctx: import("@react-native-community/cli-types").Config, args: import("./buildIOS/buildOptions").BuildFlags) => Promise<string>;
    examples: {
        desc: string;
        cmd: string;
    }[];
    options: ({
        name: string;
        description: string;
        parse?: undefined;
    } | {
        name: string;
        description: string;
        parse: (val: string) => string[];
    })[];
})[];
export default _default;
//# sourceMappingURL=index.d.ts.map