/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.win32 = exports.wsl = exports.linux = exports.darwin = exports.darwinFast = void 0;
const fs = require("fs");
const path = require("path");
const os_1 = require("os");
const child_process_1 = require("child_process");
const escapeRegExp = require("escape-string-regexp");
const log = require('lighthouse-logger');
const utils_1 = require("./utils");
const newLineRegex = /\r?\n/;
/**
 * check for MacOS default app paths first to avoid waiting for the slow lsregister command
 */
function darwinFast() {
    const priorityOptions = [
        process.env.EDGE_PATH,
        process.env.LIGHTHOUSE_CHROMIUM_PATH,
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    ];
    for (const edgePath of priorityOptions) {
        if (edgePath && canAccess(edgePath))
            return edgePath;
    }
    return darwin()[0];
}
exports.darwinFast = darwinFast;
function darwin() {
    const suffixes = ['/Contents/MacOS/Google Edge'];
    const LSREGISTER = '/System/Library/Frameworks/CoreServices.framework' +
        '/Versions/A/Frameworks/LaunchServices.framework' +
        '/Versions/A/Support/lsregister';
    const installations = [];
    const customEdgePath = resolveEdgePath();
    if (customEdgePath) {
        installations.push(customEdgePath);
    }
    child_process_1.execSync(`${LSREGISTER} -dump` +
        ' | grep -i \'microsoft edge\\?\\.app\'' +
        ' | awk \'{$1=""; print $0}\'')
        .toString()
        .split(newLineRegex)
        .forEach((inst) => {
        suffixes.forEach(suffix => {
            const execPath = path.join(inst.substring(0, inst.indexOf('.app') + 4).trim(), suffix);
            if (canAccess(execPath) && installations.indexOf(execPath) === -1) {
                installations.push(execPath);
            }
        });
    });
    // Retains one per line to maintain readability.
    // clang-format off
    const home = escapeRegExp(process.env.HOME || os_1.homedir());
    const priorities = [
        { regex: new RegExp(`^${home}/Applications/.*Edge\\.app`), weight: 50 },
        { regex: /^\/Applications\/.*Edge.app/, weight: 100 },
        { regex: /^\/Volumes\/.*Edge.app/, weight: -2 },
    ];
    if (process.env.LIGHTHOUSE_CHROMIUM_PATH) {
        priorities.unshift({ regex: new RegExp(escapeRegExp(process.env.LIGHTHOUSE_CHROMIUM_PATH)), weight: 150 });
    }
    if (process.env.EDGE_PATH) {
        priorities.unshift({ regex: new RegExp(escapeRegExp(process.env.EDGE_PATH)), weight: 151 });
    }
    // clang-format on
    return sort(installations, priorities);
}
exports.darwin = darwin;
function resolveEdgePath() {
    if (canAccess(process.env.EDGE_PATH)) {
        return process.env.EDGE_PATH;
    }
    if (canAccess(process.env.LIGHTHOUSE_CHROMIUM_PATH)) {
        log.warn('EdgeLauncher', 'LIGHTHOUSE_CHROMIUM_PATH is deprecated, use EDGE_PATH env variable instead.');
        return process.env.LIGHTHOUSE_CHROMIUM_PATH;
    }
    return undefined;
}
/**
 * Look for linux executables in 3 ways
 * 1. Look into EDGE_PATH env variable
 * 2. Look into the directories where .desktop are saved on gnome based distro's
 * 3. Look for microsoft-edge-stable & microsoft-edge executables by using the which command
 */
function linux() {
    let installations = [];
    // 1. Look into EDGE_PATH env variable
    const customEdgePath = resolveEdgePath();
    if (customEdgePath) {
        installations.push(customEdgePath);
    }
    // 2. Look into the directories where .desktop are saved on gnome based distro's
    const desktopInstallationFolders = [
        path.join(os_1.homedir(), '.local/share/applications/'),
        '/usr/share/applications/',
    ];
    desktopInstallationFolders.forEach(folder => {
        installations = installations.concat(findEdgeExecutables(folder));
    });
    // Look for microsoft-edge(-stable) & chromium(-browser) executables by using the which command
    const executables = [
        'microsoft-edge-stable',
        'microsoft-edge',
        'chromium-browser',
        'chromium',
    ];
    executables.forEach((executable) => {
        try {
            const edgePath = child_process_1.execFileSync('which', [executable], { stdio: 'pipe' }).toString().split(newLineRegex)[0];
            if (canAccess(edgePath)) {
                installations.push(edgePath);
            }
        }
        catch (e) {
            // Not installed.
        }
    });
    if (!installations.length) {
        throw new utils_1.EdgePathNotSetError();
    }
    const priorities = [
        { regex: /edge-wrapper$/, weight: 51 },
        { regex: /microsoft-edge-stable$/, weight: 50 },
        { regex: /microsoft-edge$/, weight: 49 },
        { regex: /edge-browser$/, weight: 48 },
        { regex: /edge$/, weight: 47 },
    ];
    if (process.env.LIGHTHOUSE_CHROMIUM_PATH) {
        priorities.unshift({ regex: new RegExp(escapeRegExp(process.env.LIGHTHOUSE_CHROMIUM_PATH)), weight: 100 });
    }
    if (process.env.EDGE_PATH) {
        priorities.unshift({ regex: new RegExp(escapeRegExp(process.env.EDGE_PATH)), weight: 101 });
    }
    return sort(uniq(installations.filter(Boolean)), priorities);
}
exports.linux = linux;
function wsl() {
    // Manually populate the environment variables assuming it's the default config
    process.env.LOCALAPPDATA = utils_1.getLocalAppDataPath(`${process.env.PATH}`);
    process.env.PROGRAMFILES = '/mnt/c/Program Files';
    process.env['PROGRAMFILES(X86)'] = '/mnt/c/Program Files (x86)';
    return win32();
}
exports.wsl = wsl;
function win32() {
    const installations = [];
    const suffixes = [
        `${path.sep}Microsoft${path.sep}Edge SxS${path.sep}Application${path.sep}edge.exe`,
        `${path.sep}Microsoft${path.sep}Edge${path.sep}Application${path.sep}edge.exe`
    ];
    const prefixes = [
        process.env.LOCALAPPDATA, process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)']
    ].filter(Boolean);
    const customEdgePath = resolveEdgePath();
    if (customEdgePath) {
        installations.push(customEdgePath);
    }
    prefixes.forEach(prefix => suffixes.forEach(suffix => {
        const edgePath = path.join(prefix, suffix);
        if (canAccess(edgePath)) {
            installations.push(edgePath);
        }
    }));
    return installations;
}
exports.win32 = win32;
function sort(installations, priorities) {
    const defaultPriority = 10;
    return installations
        // assign priorities
        .map((inst) => {
        for (const pair of priorities) {
            if (pair.regex.test(inst)) {
                return { path: inst, weight: pair.weight };
            }
        }
        return { path: inst, weight: defaultPriority };
    })
        // sort based on priorities
        .sort((a, b) => (b.weight - a.weight))
        // remove priority flag
        .map(pair => pair.path);
}
function canAccess(file) {
    if (!file) {
        return false;
    }
    try {
        fs.accessSync(file);
        return true;
    }
    catch (e) {
        return false;
    }
}
function uniq(arr) {
    return Array.from(new Set(arr));
}
function findEdgeExecutables(folder) {
    const argumentsRegex = /(^[^ ]+).*/; // Take everything up to the first space
    const edgeExecRegex = '^Exec=\/.*\/(microsoft-edge|edge)-.*';
    let installations = [];
    if (canAccess(folder)) {
        // Output of the grep & print looks like:
        //    /opt/google/edge/microsoft-edge --profile-directory
        //    /home/user/Downloads/edge-linux/edge-wrapper %U
        let execPaths;
        // Some systems do not support grep -R so fallback to -r.
        // See https://github.com/GoogleChrome/chrome-launcher/issues/46 for more context.
        try {
            execPaths = child_process_1.execSync(`grep -ER "${edgeExecRegex}" ${folder} | awk -F '=' '{print $2}'`, { stdio: 'pipe' });
        }
        catch (e) {
            execPaths = child_process_1.execSync(`grep -Er "${edgeExecRegex}" ${folder} | awk -F '=' '{print $2}'`, { stdio: 'pipe' });
        }
        execPaths = execPaths.toString()
            .split(newLineRegex)
            .map((execPath) => execPath.replace(argumentsRegex, '$1'));
        execPaths.forEach((execPath) => canAccess(execPath) && installations.push(execPath));
    }
    return installations;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRnZS1maW5kZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZWRnZS1maW5kZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7R0FJRztBQUNILFlBQVksQ0FBQzs7O0FBRWIseUJBQTBCO0FBQzFCLDZCQUE4QjtBQUM5QiwyQkFBMkI7QUFDM0IsaURBQXFEO0FBQ3JELHFEQUFzRDtBQUN0RCxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUV6QyxtQ0FBaUU7QUFFakUsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDO0FBSTdCOztHQUVHO0FBQ0gsU0FBZ0IsVUFBVTtJQUN4QixNQUFNLGVBQWUsR0FBNEI7UUFDL0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTO1FBQ3JCLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCO1FBQ3BDLGdFQUFnRTtLQUNqRSxDQUFDO0lBRUYsS0FBSyxNQUFNLFFBQVEsSUFBSSxlQUFlLEVBQUU7UUFDdEMsSUFBSSxRQUFRLElBQUksU0FBUyxDQUFDLFFBQVEsQ0FBQztZQUFFLE9BQU8sUUFBUSxDQUFDO0tBQ3REO0lBRUQsT0FBTyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUNwQixDQUFDO0FBWkQsZ0NBWUM7QUFFRCxTQUFnQixNQUFNO0lBQ3BCLE1BQU0sUUFBUSxHQUFHLENBQUMsNkJBQTZCLENBQUMsQ0FBQztJQUVqRCxNQUFNLFVBQVUsR0FBRyxtREFBbUQ7UUFDbEUsaURBQWlEO1FBQ2pELGdDQUFnQyxDQUFDO0lBRXJDLE1BQU0sYUFBYSxHQUFrQixFQUFFLENBQUM7SUFFeEMsTUFBTSxjQUFjLEdBQUcsZUFBZSxFQUFFLENBQUM7SUFDekMsSUFBSSxjQUFjLEVBQUU7UUFDbEIsYUFBYSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztLQUNwQztJQUVELHdCQUFRLENBQ0osR0FBRyxVQUFVLFFBQVE7UUFDckIsd0NBQXdDO1FB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