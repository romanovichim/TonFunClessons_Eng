"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.fileExistsSync = fileExistsSync;
exports.directoryExistsSync = directoryExistsSync;
exports.directoryExistsAsync = directoryExistsAsync;
exports.fileExistsAsync = fileExistsAsync;
exports.removeAsync = exports.copyAsync = exports.copySync = exports.ensureDirectory = exports.ensureDirectoryAsync = void 0;
var _fsExtra = _interopRequireDefault(require("fs-extra"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function fileExistsSync(file) {
    try {
        var ref;
        var ref1;
        return (ref1 = (ref = _fsExtra.default.statSync(file)) == null ? void 0 : ref.isFile()) != null ? ref1 : false;
    } catch  {
        return false;
    }
}
function directoryExistsSync(file) {
    try {
        var ref;
        var ref2;
        return (ref2 = (ref = _fsExtra.default.statSync(file)) == null ? void 0 : ref.isDirectory()) != null ? ref2 : false;
    } catch  {
        return false;
    }
}
async function directoryExistsAsync(file) {
    var ref;
    var ref3;
    return (ref3 = (ref = await _fsExtra.default.promises.stat(file).catch(()=>null
    )) == null ? void 0 : ref.isDirectory()) != null ? ref3 : false;
}
async function fileExistsAsync(file) {
    var ref;
    var ref4;
    return (ref4 = (ref = await _fsExtra.default.promises.stat(file).catch(()=>null
    )) == null ? void 0 : ref.isFile()) != null ? ref4 : false;
}
const ensureDirectoryAsync = (path)=>_fsExtra.default.promises.mkdir(path, {
        recursive: true
    })
;
exports.ensureDirectoryAsync = ensureDirectoryAsync;
const ensureDirectory = (path)=>_fsExtra.default.mkdirSync(path, {
        recursive: true
    })
;
exports.ensureDirectory = ensureDirectory;
const copySync = _fsExtra.default.copySync;
exports.copySync = copySync;
const copyAsync = _fsExtra.default.copy;
exports.copyAsync = copyAsync;
const removeAsync = _fsExtra.default.remove;
exports.removeAsync = removeAsync;

//# sourceMappingURL=dir.js.map