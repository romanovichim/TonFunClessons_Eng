"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.openBrowserAsync = openBrowserAsync;
var _betterOpn = _interopRequireDefault(require("better-opn"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function openBrowserAsync(target, options) {
    if (process.platform !== "win32") {
        return await (0, _betterOpn).default(target, options);
    }
    const oldSystemRoot = process.env.SYSTEMROOT;
    try {
        var _SYSTEMROOT;
        process.env.SYSTEMROOT = (_SYSTEMROOT = process.env.SYSTEMROOT) != null ? _SYSTEMROOT : process.env.SystemRoot;
        return await (0, _betterOpn).default(target, options);
    } finally{
        process.env.SYSTEMROOT = oldSystemRoot;
    }
}

//# sourceMappingURL=open.js.map