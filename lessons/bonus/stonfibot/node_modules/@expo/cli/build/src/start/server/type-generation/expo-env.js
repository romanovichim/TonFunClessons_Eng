"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.writeExpoEnvDTS = writeExpoEnvDTS;
exports.removeExpoEnvDTS = removeExpoEnvDTS;
var _promises = _interopRequireDefault(require("fs/promises"));
var _path = _interopRequireDefault(require("path"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const template = `/// <reference types="expo/types" />

// NOTE: This file should not be edited and should be in your git ignore`;
async function writeExpoEnvDTS(projectRoot) {
    return _promises.default.writeFile(_path.default.join(projectRoot, "expo-env.d.ts"), template);
}
async function removeExpoEnvDTS(projectRoot) {
    // Force removal of expo-env.d.ts - Ignore any errors if the file does not exist
    return _promises.default.rm(_path.default.join(projectRoot, "expo-env.d.ts"), {
        force: true
    });
}

//# sourceMappingURL=expo-env.js.map