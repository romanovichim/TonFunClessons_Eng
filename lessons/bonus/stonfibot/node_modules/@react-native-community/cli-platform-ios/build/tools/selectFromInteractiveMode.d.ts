import { IosInfo } from '../types';
interface Args {
    scheme?: string;
    mode?: string;
    info: IosInfo | undefined;
}
export declare function selectFromInteractiveMode({ scheme, mode, info, }: Args): Promise<{
    scheme?: string;
    mode?: string;
}>;
export {};
//# sourceMappingURL=selectFromInteractiveMode.d.ts.map