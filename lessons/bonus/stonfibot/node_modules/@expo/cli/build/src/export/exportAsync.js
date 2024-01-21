"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.exportAsync = exportAsync;
var _path = _interopRequireDefault(require("path"));
var _exportApp = require("./exportApp");
var Log = _interopRequireWildcard(require("../log"));
var _fileNotifier = require("../utils/FileNotifier");
var _dir = require("../utils/dir");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    } else {
        var newObj = {};
        if (obj != null) {
            for(var key in obj){
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};
                    if (desc.get || desc.set) {
                        Object.defineProperty(newObj, key, desc);
                    } else {
                        newObj[key] = obj[key];
                    }
                }
            }
        }
        newObj.default = obj;
        return newObj;
    }
}
async function exportAsync(projectRoot, options) {
    // Ensure the output directory is created
    const outputPath = _path.default.resolve(projectRoot, options.outputDir);
    // Delete the output directory if it exists
    await (0, _dir).removeAsync(outputPath);
    // Create the output directory
    await (0, _dir).ensureDirectoryAsync(outputPath);
    // Export the app
    await (0, _exportApp).exportAppAsync(projectRoot, options);
    // Stop any file watchers to prevent the CLI from hanging.
    _fileNotifier.FileNotifier.stopAll();
    // Final notes
    Log.log(`App exported to: ${options.outputDir}`);
}

//# sourceMappingURL=exportAsync.js.map