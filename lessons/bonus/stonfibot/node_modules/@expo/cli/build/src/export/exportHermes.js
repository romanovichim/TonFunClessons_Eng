"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.isEnableHermesManaged = isEnableHermesManaged;
exports.parseGradleProperties = parseGradleProperties;
exports.maybeThrowFromInconsistentEngineAsync = maybeThrowFromInconsistentEngineAsync;
exports.maybeInconsistentEngineAndroidAsync = maybeInconsistentEngineAndroidAsync;
exports.maybeInconsistentEngineIosAsync = maybeInconsistentEngineIosAsync;
exports.isHermesBytecodeBundleAsync = isHermesBytecodeBundleAsync;
exports.getHermesBytecodeBundleVersionAsync = getHermesBytecodeBundleVersionAsync;
var _fsExtra = _interopRequireDefault(require("fs-extra"));
var _path = _interopRequireDefault(require("path"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function isEnableHermesManaged(expoConfig, platform) {
    switch(platform){
        case "android":
            {
                var ref;
                var ref1;
                return ((ref1 = (ref = expoConfig.android) == null ? void 0 : ref.jsEngine) != null ? ref1 : expoConfig.jsEngine) !== "jsc";
            }
        case "ios":
            {
                var ref2;
                var ref3;
                return ((ref3 = (ref2 = expoConfig.ios) == null ? void 0 : ref2.jsEngine) != null ? ref3 : expoConfig.jsEngine) !== "jsc";
            }
        default:
            return false;
    }
}
function parseGradleProperties(content) {
    const result = {};
    for (let line of content.split("\n")){
        line = line.trim();
        if (!line || line.startsWith("#")) {
            continue;
        }
        const sepIndex = line.indexOf("=");
        const key = line.substr(0, sepIndex);
        const value = line.substr(sepIndex + 1);
        result[key] = value;
    }
    return result;
}
async function maybeThrowFromInconsistentEngineAsync(projectRoot, configFilePath, platform, isHermesManaged) {
    const configFileName = _path.default.basename(configFilePath);
    if (platform === "android" && await maybeInconsistentEngineAndroidAsync(projectRoot, isHermesManaged)) {
        throw new Error(`JavaScript engine configuration is inconsistent between ${configFileName} and Android native project.\n` + `In ${configFileName}: Hermes is ${isHermesManaged ? "enabled" : "not enabled"}\n` + `In Android native project: Hermes is ${isHermesManaged ? "not enabled" : "enabled"}\n` + `Please check the following files for inconsistencies:\n` + `  - ${configFilePath}\n` + `  - ${_path.default.join(projectRoot, "android", "gradle.properties")}\n` + `  - ${_path.default.join(projectRoot, "android", "app", "build.gradle")}\n` + "Learn more: https://expo.fyi/hermes-android-config");
    }
    if (platform === "ios" && await maybeInconsistentEngineIosAsync(projectRoot, isHermesManaged)) {
        throw new Error(`JavaScript engine configuration is inconsistent between ${configFileName} and iOS native project.\n` + `In ${configFileName}: Hermes is ${isHermesManaged ? "enabled" : "not enabled"}\n` + `In iOS native project: Hermes is ${isHermesManaged ? "not enabled" : "enabled"}\n` + `Please check the following files for inconsistencies:\n` + `  - ${configFilePath}\n` + `  - ${_path.default.join(projectRoot, "ios", "Podfile")}\n` + `  - ${_path.default.join(projectRoot, "ios", "Podfile.properties.json")}\n` + "Learn more: https://expo.fyi/hermes-ios-config");
    }
}
async function maybeInconsistentEngineAndroidAsync(projectRoot, isHermesManaged) {
    // Trying best to check android native project if by chance to be consistent between app config
    // Check gradle.properties from prebuild template
    const gradlePropertiesPath = _path.default.join(projectRoot, "android", "gradle.properties");
    if (_fsExtra.default.existsSync(gradlePropertiesPath)) {
        const props = parseGradleProperties(await _fsExtra.default.readFile(gradlePropertiesPath, "utf8"));
        const isHermesBare = props["hermesEnabled"] === "true";
        if (isHermesManaged !== isHermesBare) {
            return true;
        }
    }
    return false;
}
async function maybeInconsistentEngineIosAsync(projectRoot, isHermesManaged) {
    // Trying best to check ios native project if by chance to be consistent between app config
    // Check ios/Podfile for ":hermes_enabled => true"
    const podfilePath = _path.default.join(projectRoot, "ios", "Podfile");
    if (_fsExtra.default.existsSync(podfilePath)) {
        const content = await _fsExtra.default.readFile(podfilePath, "utf8");
        const isPropsReference = content.search(/^\s*:hermes_enabled\s*=>\s*podfile_properties\['expo.jsEngine'\]\s*==\s*nil\s*\|\|\s*podfile_properties\['expo.jsEngine'\]\s*==\s*'hermes',?/m) >= 0;
        const isHermesBare = content.search(/^\s*:hermes_enabled\s*=>\s*true,?\s+/m) >= 0;
        if (!isPropsReference && isHermesManaged !== isHermesBare) {
            return true;
        }
    }
    // Check Podfile.properties.json from prebuild template
    const podfilePropertiesPath = _path.default.join(projectRoot, "ios", "Podfile.properties.json");
    if (_fsExtra.default.existsSync(podfilePropertiesPath)) {
        const props = await parsePodfilePropertiesAsync(podfilePropertiesPath);
        const isHermesBare = props["expo.jsEngine"] === "hermes";
        if (isHermesManaged !== isHermesBare) {
            return true;
        }
    }
    return false;
}
// https://github.com/facebook/hermes/blob/release-v0.5/include/hermes/BCGen/HBC/BytecodeFileFormat.h#L24-L25
const HERMES_MAGIC_HEADER = "c61fbc03c103191f";
async function isHermesBytecodeBundleAsync(file) {
    const header = await readHermesHeaderAsync(file);
    return header.slice(0, 8).toString("hex") === HERMES_MAGIC_HEADER;
}
async function getHermesBytecodeBundleVersionAsync(file) {
    const header = await readHermesHeaderAsync(file);
    if (header.slice(0, 8).toString("hex") !== HERMES_MAGIC_HEADER) {
        throw new Error("Invalid hermes bundle file");
    }
    return header.readUInt32LE(8);
}
async function readHermesHeaderAsync(file) {
    const fd = await _fsExtra.default.open(file, "r");
    const buffer = Buffer.alloc(12);
    await _fsExtra.default.read(fd, buffer, 0, 12, null);
    await _fsExtra.default.close(fd);
    return buffer;
}
async function parsePodfilePropertiesAsync(podfilePropertiesPath) {
    try {
        return JSON.parse(await _fsExtra.default.readFile(podfilePropertiesPath, "utf8"));
    } catch  {
        return {};
    }
}

//# sourceMappingURL=exportHermes.js.map