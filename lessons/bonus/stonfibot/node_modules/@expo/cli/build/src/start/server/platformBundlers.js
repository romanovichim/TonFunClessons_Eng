"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getPlatformBundlers = getPlatformBundlers;
var _resolveFrom = _interopRequireDefault(require("resolve-from"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function getPlatformBundlers(projectRoot, exp) {
    var ref, ref1, ref2;
    /**
   * SDK 50+: The web bundler is dynamic based upon the presence of the `@expo/webpack-config` package.
   */ let web = (ref = exp.web) == null ? void 0 : ref.bundler;
    if (!web) {
        const resolved = _resolveFrom.default.silent(projectRoot, "@expo/webpack-config/package.json");
        web = resolved ? "webpack" : "metro";
    }
    var ref3, ref4;
    return {
        // @ts-expect-error: not on type yet
        ios: (ref3 = (ref1 = exp.ios) == null ? void 0 : ref1.bundler) != null ? ref3 : "metro",
        // @ts-expect-error: not on type yet
        android: (ref4 = (ref2 = exp.android) == null ? void 0 : ref2.bundler) != null ? ref4 : "metro",
        web
    };
}

//# sourceMappingURL=platformBundlers.js.map