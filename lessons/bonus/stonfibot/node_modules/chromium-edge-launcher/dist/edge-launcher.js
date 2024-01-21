/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.killAll = exports.launch = exports.Launcher = void 0;
const childProcess = require("child_process");
const fs = require("fs");
const net = require("net");
const rimraf = require("rimraf");
const edgeFinder = require("./edge-finder");
const random_port_1 = require("./random-port");
const flags_1 = require("./flags");
const utils_1 = require("./utils");
const log = require('lighthouse-logger');
const spawn = childProcess.spawn;
const execSync = childProcess.execSync;
const isWsl = utils_1.getPlatform() === 'wsl';
const isWindows = utils_1.getPlatform() === 'win32';
const _SIGINT = 'SIGINT';
const _SIGINT_EXIT_CODE = 130;
const _SUPPORTED_PLATFORMS = new Set(['darwin', 'linux', 'win32', 'wsl']);
const instances = new Set();
const sigintListener = () => __awaiter(void 0, void 0, void 0, function* () {
    yield killAll();
    process.exit(_SIGINT_EXIT_CODE);
});
function launch(opts = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        opts.handleSIGINT = utils_1.defaults(opts.handleSIGINT, true);
        const instance = new Launcher(opts);
        // Kill spawned Edge process in case of ctrl-C.
        if (opts.handleSIGINT && instances.size === 0) {
            process.on(_SIGINT, sigintListener);
        }
        instances.add(instance);
        yield instance.launch();
        const kill = () => __awaiter(this, void 0, void 0, function* () {
            instances.delete(instance);
            if (instances.size === 0) {
                process.removeListener(_SIGINT, sigintListener);
            }
            return instance.kill();
        });
        return { pid: instance.pid, port: instance.port, kill, process: instance.edge };
    });
}
exports.launch = launch;
function killAll() {
    return __awaiter(this, void 0, void 0, function* () {
        let errors = [];
        for (const instance of instances) {
            try {
                yield instance.kill();
                // only delete if kill did not error
                // this means erroring instances remain in the Set
                instances.delete(instance);
            }
            catch (err) {
                errors.push(err);
            }
        }
        return errors;
    });
}
exports.killAll = killAll;
class Launcher {
    constructor(opts = {}, moduleOverrides = {}) {
        this.opts = opts;
        this.tmpDirandPidFileReady = false;
        this.fs = moduleOverrides.fs || fs;
        this.rimraf = moduleOverrides.rimraf || rimraf;
        this.spawn = moduleOverrides.spawn || spawn;
        log.setLevel(utils_1.defaults(this.opts.logLevel, 'silent'));
        // choose the first one (default)
        this.startingUrl = utils_1.defaults(this.opts.startingUrl, 'about:blank');
        this.edgeFlags = utils_1.defaults(this.opts.edgeFlags, []);
        this.requestedPort = utils_1.defaults(this.opts.port, 0);
        this.edgePath = this.opts.edgePath;
        this.ignoreDefaultFlags = utils_1.defaults(this.opts.ignoreDefaultFlags, false);
        this.connectionPollInterval = utils_1.defaults(this.opts.connectionPollInterval, 500);
        this.maxConnectionRetries = utils_1.defaults(this.opts.maxConnectionRetries, 50);
        this.envVars = utils_1.defaults(opts.envVars, Object.assign({}, process.env));
        if (typeof this.opts.userDataDir === 'boolean') {
            if (!this.opts.userDataDir) {
                this.useDefaultProfile = true;
                this.userDataDir = undefined;
            }
            else {
                throw new utils_1.InvalidUserDataDirectoryError();
            }
        }
        else {
            this.useDefaultProfile = false;
            this.userDataDir = this.opts.userDataDir;
        }
    }
    get flags() {
        const flags = this.ignoreDefaultFlags ? [] : flags_1.DEFAULT_FLAGS.slice();
        flags.push(`--remote-debugging-port=${this.port}`);
        if (!this.ignoreDefaultFlags && utils_1.getPlatform() === 'linux') {
            flags.push('--disable-setuid-sandbox');
        }
        if (!this.useDefaultProfile) {
            // Place Edge profile in a custom location we'll rm -rf later
            // If in WSL, we need to use the Windows format
            flags.push(`--user-data-dir=${isWsl ? utils_1.toWinDirFormat(this.userDataDir) : this.userDataDir}`);
        }
        flags.push(...this.edgeFlags);
        flags.push(this.startingUrl);
        return flags;
    }
    static defaultFlags() {
        return flags_1.DEFAULT_FLAGS.slice();
    }
    /** Returns the highest priority edge installation. */
    static getFirstInstallation() {
        if (utils_1.getPlatform() === 'darwin')
            return edgeFinder.darwinFast();
        return edgeFinder[utils_1.getPlatform()]()[0];
    }
    // Wrapper function to enable easy testing.
    makeTmpDir() {
        return utils_1.makeTmpDir();
    }
    prepare() {
        const platform = utils_1.getPlatform();
        if (!_SUPPORTED_PLATFORMS.has(platform)) {
            throw new utils_1.UnsupportedPlatformError();
        }
        this.userDataDir = this.userDataDir || this.makeTmpDir();
        this.outFile = this.fs.openSync(`${this.userDataDir}/edge-out.log`, 'a');
        this.errFile = this.fs.openSync(`${this.userDataDir}/edge-err.log`, 'a');
        // fix for Node4
        // you can't pass a fd to fs.writeFileSync
        this.pidFile = `${this.userDataDir}/edge.pid`;
        log.verbose('EdgeLauncher', `created ${this.userDataDir}`);
        this.tmpDirandPidFileReady = true;
    }
    launch() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.requestedPort !== 0) {
                this.port = this.requestedPort;
                // If an explict port is passed first look for an open connection...
                try {
                    return yield this.isDebuggerReady();
                }
                catch (err) {
                    log.log('EdgeLauncher', `No debugging port found on port ${this.port}, launching a new Edge.`);
                }
            }
            if (this.edgePath === undefined) {
                const installation = Launcher.getFirstInstallation();
                if (!installation) {
                    throw new utils_1.EdgeNotInstalledError();
                }
                this.edgePath = installation;
            }
            if (!this.tmpDirandPidFileReady) {
                this.prepare();
            }
            this.pid = yield this.spawnProcess(this.edgePath);
            return Promise.resolve();
        });
    }
    spawnProcess(execPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const spawnPromise = (() => __awaiter(this, void 0, void 0, function* () {
                if (this.edge) {
                    log.log('EdgeLauncher', `Edge already running with pid ${this.edge.pid}.`);
                    return this.edge.pid;
                }
                // If a zero value port is set, it means the launcher
                // is responsible for generating the port number.
                // We do this here so that we can know the port before
                // we pass it into edge.
                if (this.requestedPort === 0) {
                    this.port = yield random_port_1.getRandomPort();
                }
                log.verbose('EdgeLauncher', `Launching with command:\n"${execPath}" ${this.flags.join(' ')}`);
                const edge = this.spawn(execPath, this.flags, { detached: true, stdio: ['ignore', this.outFile, this.errFile], env: this.envVars });
                this.edge = edge;
                this.fs.writeFileSync(this.pidFile, edge.pid.toString());
                log.verbose('EdgeLauncher', `Edge running with pid ${edge.pid} on port ${this.port}.`);
                return edge.pid;
            }))();
            const pid = yield spawnPromise;
            yield this.waitUntilReady();
            return pid;
        });
    }
    cleanup(client) {
        if (client) {
            client.removeAllListeners();
            client.end();
            client.destroy();
            client.unref();
        }
    }
    // resolves if ready, rejects otherwise
    isDebuggerReady() {
        return new Promise((resolve, reject) => {
            const client = net.createConnection(this.port);
            client.once('error', err => {
                this.cleanup(client);
                reject(err);
            });
            client.once('connect', () => {
                this.cleanup(client);
                resolve();
            });
        });
    }
    // resolves when debugger is ready, rejects after 10 polls
    waitUntilReady() {
        const launcher = this;
        return new Promise((resolve, reject) => {
            let retries = 0;
            let waitStatus = 'Waiting for browser.';
            const poll = () => {
                if (retries === 0) {
                    log.log('EdgeLauncher', waitStatus);
                }
                retries++;
                waitStatus += '..';
                log.log('EdgeLauncher', waitStatus);
                launcher.isDebuggerReady()
                    .then(() => {
                    log.log('EdgeLauncher', waitStatus + `${log.greenify(log.tick)}`);
                    resolve();
                })
                    .catch(err => {
                    if (retries > launcher.maxConnectionRetries) {
                        log.error('EdgeLauncher', err.message);
                        const stderr = this.fs.readFileSync(`${this.userDataDir}/edge-err.log`, { encoding: 'utf-8' });
                        log.error('EdgeLauncher', `Logging contents of ${this.userDataDir}/edge-err.log`);
                        log.error('EdgeLauncher', stderr);
                        return reject(err);
                    }
                    utils_1.delay(launcher.connectionPollInterval).then(poll);
                });
            };
            poll();
        });
    }
    kill() {
        return new Promise((resolve, reject) => {
            if (this.edge) {
                this.edge.on('close', () => {
                    delete this.edge;
                    this.destroyTmp().then(resolve);
                });
                log.log('EdgeLauncher', `Killing Edge instance ${this.edge.pid}`);
                try {
                    if (isWindows) {
                        // While pipe is the default, stderr also gets printed to process.stderr
                        // if you don't explicitly set `stdio`
                        execSync(`taskkill /pid ${this.edge.pid} /T /F`, { stdio: 'pipe' });
                    }
                    else {
                        process.kill(-this.edge.pid);
                    }
                }
                catch (err) {
                    const message = `Edge could not be killed ${err.message}`;
                    log.warn('EdgeLauncher', message);
                    reject(new Error(message));
                }
            }
            else {
                // fail silently as we did not start edge
                resolve();
            }
        });
    }
    destroyTmp() {
        return new Promise(resolve => {
            // Only clean up the tmp dir if we created it.
            if (this.userDataDir === undefined || this.opts.userDataDir !== undefined) {
                return resolve();
            }
            if (this.outFile) {
                this.fs.closeSync(this.outFile);
                delete this.outFile;
            }
            if (this.errFile) {
                this.fs.closeSync(this.errFile);
                delete this.errFile;
            }
            this.rimraf(this.userDataDir, () => resolve());
        });
    }
}
exports.Launcher = Launcher;
;
exports.default = Launcher;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRnZS1sYXVuY2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9lZGdlLWxhdW5jaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0dBSUc7QUFDSCxZQUFZLENBQUM7Ozs7Ozs7Ozs7OztBQUViLDhDQUE4QztBQUM5Qyx5QkFBeUI7QUFDekIsMkJBQTJCO0FBQzNCLGlDQUFpQztBQUNqQyw0Q0FBNEM7QUFDNUMsK0NBQTRDO0FBQzVDLG1DQUFzQztBQUN0QyxtQ0FBaUs7QUFFakssTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7QUFDekMsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQztBQUNqQyxNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFDO0FBQ3ZDLE1BQU0sS0FBSyxHQUFHLG1CQUFXLEVBQUUsS0FBSyxLQUFLLENBQUM7QUFDdEMsTUFBTSxTQUFTLEdBQUcsbUJBQVcsRUFBRSxLQUFLLE9BQU8sQ0FBQztBQUM1QyxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUM7QUFDekIsTUFBTSxpQkFBaUIsR0FBRyxHQUFHLENBQUM7QUFDOUIsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFJMUUsTUFBTSxTQUFTLEdBQUcsSUFBSSxHQUFHLEVBQVksQ0FBQztBQStCdEMsTUFBTSxjQUFjLEdBQUcsR0FBUyxFQUFFO0lBQ2hDLE1BQU0sT0FBTyxFQUFFLENBQUM7SUFDaEIsT0FBTyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQ2xDLENBQUMsQ0FBQSxDQUFDO0FBRUYsU0FBZSxNQUFNLENBQUMsT0FBZ0IsRUFBRTs7UUFDdEMsSUFBSSxDQUFDLFlBQVksR0FBRyxnQkFBUSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFD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