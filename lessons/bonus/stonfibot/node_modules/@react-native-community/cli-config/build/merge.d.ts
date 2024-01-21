/**
 * `deepmerge` concatenates arrays by default instead of overwriting them.
 * We define custom merging function for arrays to change that behaviour
 */
export default function merge<X, Y>(x: Partial<X>, y: Partial<Y>): X & Y;
//# sourceMappingURL=merge.d.ts.map