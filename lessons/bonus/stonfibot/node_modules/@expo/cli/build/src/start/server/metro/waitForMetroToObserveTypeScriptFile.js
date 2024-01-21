"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.waitForMetroToObserveTypeScriptFile = waitForMetroToObserveTypeScriptFile;
exports.observeFileChanges = observeFileChanges;
exports.observeAnyFileChanges = observeAnyFileChanges;
var _path = _interopRequireDefault(require("path"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const debug = require("debug")("expo:start:server:metro:waitForTypescript");
function waitForMetroToObserveTypeScriptFile(projectRoot, runner, callback) {
    const watcher = runner.metro.getBundler().getBundler().getWatcher();
    const tsconfigPath = _path.default.join(projectRoot, "tsconfig.json");
    const listener = ({ eventsQueue  })=>{
        for (const event of eventsQueue){
            var ref;
            if (event.type === "add" && ((ref = event.metadata) == null ? void 0 : ref.type) !== "d" && // We need to ignore node_modules because Metro will add all of the files in node_modules to the watcher.
            !/node_modules/.test(event.filePath)) {
                const { filePath  } = event;
                // Is TypeScript?
                if (// If the user adds a TypeScript file to the observable files in their project.
                /\.tsx?$/.test(filePath) || // Or if the user adds a tsconfig.json file to the project root.
                filePath === tsconfigPath) {
                    debug("Detected TypeScript file added to the project: ", filePath);
                    callback();
                    off();
                    return;
                }
            }
        }
    };
    debug("Waiting for TypeScript files to be added to the project...");
    watcher.addListener("change", listener);
    const off = ()=>{
        watcher.removeListener("change", listener);
    };
    runner.server.addListener == null ? void 0 : runner.server.addListener("close", off);
    return off;
}
function observeFileChanges(runner, files, callback) {
    const watcher = runner.metro.getBundler().getBundler().getWatcher();
    const listener = ({ eventsQueue  })=>{
        for (const event of eventsQueue){
            var // event.type === 'add' &&
            ref;
            if (((ref = event.metadata) == null ? void 0 : ref.type) !== "d" && // We need to ignore node_modules because Metro will add all of the files in node_modules to the watcher.
            !/node_modules/.test(event.filePath)) {
                const { filePath  } = event;
                // Is TypeScript?
                if (files.includes(filePath)) {
                    debug("Observed change:", filePath);
                    callback();
                    return;
                }
            }
        }
    };
    debug("Watching file changes:", files);
    watcher.addListener("change", listener);
    const off = ()=>{
        watcher.removeListener("change", listener);
    };
    runner.server.addListener == null ? void 0 : runner.server.addListener("close", off);
    return off;
}
function observeAnyFileChanges(runner, callback) {
    const watcher = runner.metro.getBundler().getBundler().getWatcher();
    const listener = ({ eventsQueue  })=>{
        callback(eventsQueue);
    };
    watcher.addListener("change", listener);
    const off = ()=>{
        watcher.removeListener("change", listener);
    };
    runner.server.addListener == null ? void 0 : runner.server.addListener("close", off);
    return off;
}

//# sourceMappingURL=waitForMetroToObserveTypeScriptFile.js.map