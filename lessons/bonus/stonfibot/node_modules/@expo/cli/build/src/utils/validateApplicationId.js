"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.validateBundleId = validateBundleId;
exports.validatePackage = validatePackage;
exports.validatePackageWithWarning = validatePackageWithWarning;
exports.assertValidBundleId = assertValidBundleId;
exports.assertValidPackage = assertValidPackage;
exports.getBundleIdWarningInternalAsync = getBundleIdWarningInternalAsync;
exports.getPackageNameWarningInternalAsync = getPackageNameWarningInternalAsync;
exports.getPackageNameWarningAsync = exports.getBundleIdWarningAsync = void 0;
var _assert = _interopRequireDefault(require("assert"));
var _chalk = _interopRequireDefault(require("chalk"));
var _env = require("./env");
var _fn = require("./fn");
var _link = require("./link");
var _url = require("./url");
var _client = require("../api/rest/client");
var _log = require("../log");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const debug = require("debug")("expo:utils:validateApplicationId");
const IOS_BUNDLE_ID_REGEX = /^[a-zA-Z0-9-.]+$/;
const ANDROID_PACKAGE_REGEX = /^(?!.*\bnative\b)[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;
function validateBundleId(value) {
    return IOS_BUNDLE_ID_REGEX.test(value);
}
function validatePackage(value) {
    return validatePackageWithWarning(value) === true;
}
function validatePackageWithWarning(value) {
    const parts = value.split(".");
    for (const segment of parts){
        if (RESERVED_ANDROID_PACKAGE_NAME_SEGMENTS.includes(segment)) {
            return `"${segment}" is a reserved Java keyword.`;
        }
    }
    if (parts.length < 2) {
        return `Package name must contain more than one segment, separated by ".", e.g. com.${value}`;
    }
    if (!ANDROID_PACKAGE_REGEX.test(value)) {
        return 'Invalid characters in Android package name. Only alphanumeric characters, "." and "_" are allowed, and each "." must be followed by a letter or number.';
    }
    return true;
}
// https://en.wikipedia.org/wiki/List_of_Java_keywords
// Running the following in the console and pruning the "Reserved Identifiers" section:
// [...document.querySelectorAll('dl > dt > code')].map(node => node.innerText)
const RESERVED_ANDROID_PACKAGE_NAME_SEGMENTS = [
    // List of Java keywords
    "_",
    "abstract",
    "assert",
    "boolean",
    "break",
    "byte",
    "case",
    "catch",
    "char",
    "class",
    "const",
    "continue",
    "default",
    "do",
    "double",
    "else",
    "enum",
    "extends",
    "final",
    "finally",
    "float",
    "for",
    "goto",
    "if",
    "implements",
    "import",
    "instanceof",
    "int",
    "interface",
    "long",
    "native",
    "new",
    "package",
    "private",
    "protected",
    "public",
    "return",
    "short",
    "static",
    "super",
    "switch",
    "synchronized",
    "this",
    "throw",
    "throws",
    "transient",
    "try",
    "void",
    "volatile",
    "while",
    // Reserved words for literal values
    "true",
    "false",
    "null",
    // Unused
    "const",
    "goto",
    "strictfp", 
];
function assertValidBundleId(value) {
    _assert.default.match(value, IOS_BUNDLE_ID_REGEX, `The ios.bundleIdentifier defined in your Expo config is not formatted properly. Only alphanumeric characters, '.', '-', and '_' are allowed, and each '.' must be followed by a letter.`);
}
function assertValidPackage(value) {
    _assert.default.match(value, ANDROID_PACKAGE_REGEX, `Invalid format of Android package name. Only alphanumeric characters, '.' and '_' are allowed, and each '.' must be followed by a letter. The Java keyword 'native' is not allowed.`);
}
async function getBundleIdWarningInternalAsync(bundleId) {
    if (_env.env.EXPO_OFFLINE) {
        _log.Log.warn("Skipping Apple bundle identifier reservation validation in offline-mode.");
        return null;
    }
    if (!await (0, _url).isUrlAvailableAsync("itunes.apple.com")) {
        debug(`Couldn't connect to iTunes Store to check bundle ID ${bundleId}. itunes.apple.com may be down.`);
        // If no network, simply skip the warnings since they'll just lead to more confusion.
        return null;
    }
    const url = `http://itunes.apple.com/lookup?bundleId=${bundleId}`;
    try {
        debug(`Checking iOS bundle ID '${bundleId}' at: ${url}`);
        const response = await (0, _client).fetchAsync(url);
        const json = await response.json();
        if (json.resultCount > 0) {
            const firstApp = json.results[0];
            return formatInUseWarning(firstApp.trackName, firstApp.sellerName, bundleId);
        }
    } catch (error) {
        debug(`Error checking bundle ID ${bundleId}: ${error.message}`);
    // Error fetching itunes data.
    }
    return null;
}
const getBundleIdWarningAsync = (0, _fn).memoize(getBundleIdWarningInternalAsync);
exports.getBundleIdWarningAsync = getBundleIdWarningAsync;
async function getPackageNameWarningInternalAsync(packageName) {
    if (_env.env.EXPO_OFFLINE) {
        _log.Log.warn("Skipping Android package name reservation validation in offline-mode.");
        return null;
    }
    if (!await (0, _url).isUrlAvailableAsync("play.google.com")) {
        debug(`Couldn't connect to Play Store to check package name ${packageName}. play.google.com may be down.`);
        // If no network, simply skip the warnings since they'll just lead to more confusion.
        return null;
    }
    const url = `https://play.google.com/store/apps/details?id=${packageName}`;
    try {
        debug(`Checking Android package name '${packageName}' at: ${url}`);
        const response = await (0, _client).fetchAsync(url);
        // If the page exists, then warn the user.
        if (response.status === 200) {
            // There is no JSON API for the Play Store so we can't concisely
            // locate the app name and developer to match the iOS warning.
            return `⚠️  The package ${_chalk.default.bold(packageName)} is already in use. ${_chalk.default.dim((0, _link).learnMore(url))}`;
        }
    } catch (error) {
        // Error fetching play store data or the page doesn't exist.
        debug(`Error checking package name ${packageName}: ${error.message}`);
    }
    return null;
}
function formatInUseWarning(appName, author, id) {
    return `⚠️  The app ${_chalk.default.bold(appName)} by ${_chalk.default.italic(author)} is already using ${_chalk.default.bold(id)}`;
}
const getPackageNameWarningAsync = (0, _fn).memoize(getPackageNameWarningInternalAsync);
exports.getPackageNameWarningAsync = getPackageNameWarningAsync;

//# sourceMappingURL=validateApplicationId.js.map