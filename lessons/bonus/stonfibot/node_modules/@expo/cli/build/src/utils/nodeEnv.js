"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.setNodeEnv = setNodeEnv;
function setNodeEnv(mode) {
    process.env.NODE_ENV = process.env.NODE_ENV || mode;
    process.env.BABEL_ENV = process.env.BABEL_ENV || process.env.NODE_ENV;
}

//# sourceMappingURL=nodeEnv.js.map