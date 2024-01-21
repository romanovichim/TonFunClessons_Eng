import { Device } from '../types';
type FlagsT = {
    simulator?: string;
    udid?: string;
};
export declare function getDestinationSimulator(args: FlagsT, fallbackSimulators?: string[]): Device;
export {};
//# sourceMappingURL=getDestinationSimulator.d.ts.map