"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNodeModuleName = void 0;
function moduleNameFromPath(modulePath) {
    if (modulePath.startsWith('@')) {
        const [org, packageName] = modulePath.split('/');
        if (org && packageName) {
            return [org, packageName].join('/');
        }
        return modulePath;
    }
    const [packageName] = modulePath.split('/');
    return packageName ? packageName : modulePath;
}
const NODE_MODULE_PATTERN = /node_modules(\/\.(pnpm|store)\/.*\/node_modules)?\//i;
function getNodeModuleName(filePath) {
    // '/<project>/node_modules/react-native/ReactCommon/react/renderer/components/rncore/EventEmitters.cpp'
    // '/<project>/node_modules/.pnpm/react-native@0.73.1_@babel+core@7.20.2_react@18.2.0/node_modules/react-native/ReactCommon/react/renderer/components/rncore/EventEmitters.cpp'
    // '/<project>/node_modules/.store/react-native@0.73.1-OKL2xQk6utgOIuOl3VvO_g/node_modules/react-native/ReactCommon/react/renderer/components/rncore/EventEmitters.cpp'
    const [, , , modulePath] = filePath.split(NODE_MODULE_PATTERN);
    if (modulePath) {
        return moduleNameFromPath(modulePath);
    }
    return null;
}
exports.getNodeModuleName = getNodeModuleName;
//# sourceMappingURL=getNodeModuleName.js.map