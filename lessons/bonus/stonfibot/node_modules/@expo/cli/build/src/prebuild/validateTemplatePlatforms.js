"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.validateTemplatePlatforms = validateTemplatePlatforms;
var _chalk = _interopRequireDefault(require("chalk"));
var _path = _interopRequireDefault(require("path"));
var Log = _interopRequireWildcard(require("../log"));
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
function validateTemplatePlatforms({ templateDirectory , platforms  }) {
    const existingPlatforms = [];
    for (const platform of platforms){
        if ((0, _dir).directoryExistsSync(_path.default.join(templateDirectory, platform))) {
            existingPlatforms.push(platform);
        } else {
            Log.warn(_chalk.default`⚠️  Skipping platform ${platform}. Use a template that contains native files for ${platform} (./${platform}).`);
        }
    }
    return existingPlatforms;
}

//# sourceMappingURL=validateTemplatePlatforms.js.map