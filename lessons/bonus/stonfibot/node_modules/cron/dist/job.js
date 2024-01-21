"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronJob = void 0;
const child_process_1 = require("child_process");
const errors_1 = require("./errors");
const time_1 = require("./time");
class CronJob {
    constructor(cronTime, onTick, onComplete, start, timeZone, context, runOnInit, utcOffset, unrefTimeout) {
        this.running = false;
        this.unrefTimeout = false;
        this.lastExecution = null;
        this.runOnce = false;
        this._callbacks = [];
        this.context = (context !== null && context !== void 0 ? context : this);
        if (timeZone != null && utcOffset != null) {
            throw new errors_1.ExclusiveParametersError('timeZone', 'utcOffset');
        }
        if (timeZone != null) {
            this.cronTime = new time_1.CronTime(cronTime, timeZone, null);
        }
        else if (utcOffset != null) {
            this.cronTime = new time_1.CronTime(cronTime, null, utcOffset);
        }
        else {
            this.cronTime = new time_1.CronTime(cronTime, timeZone, utcOffset);
        }
        if (unrefTimeout != null) {
            this.unrefTimeout = unrefTimeout;
        }
        if (onComplete != null) {
            this.onComplete = this._fnWrap(onComplete);
        }
        if (this.cronTime.realDate) {
            this.runOnce = true;
        }
        this.addCallback(this._fnWrap(onTick));
        if (runOnInit) {
            this.lastExecution = new Date();
            this.fireOnTick();
        }
        if (start)
            this.start();
    }
    static from(params) {
        if (params.timeZone != null && params.utcOffset != null) {
            throw new errors_1.ExclusiveParametersError('timeZone', 'utcOffset');
        }
        if (params.timeZone != null) {
            return new CronJob(params.cronTime, params.onTick, params.onComplete, params.start, params.timeZone, params.context, params.runOnInit, params.utcOffset, params.unrefTimeout);
        }
        else if (params.utcOffset != null) {
            return new CronJob(params.cronTime, params.onTick, params.onComplete, params.start, null, params.context, params.runOnInit, params.utcOffset, params.unrefTimeout);
        }
        else {
            return new CronJob(params.cronTime, params.onTick, params.onComplete, params.start, params.timeZone, params.context, params.runOnInit, params.utcOffset, params.unrefTimeout);
        }
    }
    _fnWrap(cmd) {
        var _a, _b;
        switch (typeof cmd) {
            case 'function': {
                return cmd;
            }
            case 'string': {
                const [command, ...args] = cmd.split(' ');
                return child_process_1.spawn.bind(undefined, command !== null && command !== void 0 ? command : cmd, args, {});
            }
            case 'object': {
                return child_process_1.spawn.bind(undefined, cmd.command, (_a = cmd.args) !== null && _a !== void 0 ? _a : [], (_b = cmd.options) !== null && _b !== void 0 ? _b : {});
            }
        }
    }
    addCallback(callback) {
        if (typeof callback === 'function') {
            this._callbacks.push(callback);
        }
    }
    setTime(time) {
        if (!(time instanceof time_1.CronTime)) {
            throw new errors_1.CronError('time must be an instance of CronTime.');
        }
        const wasRunning = this.running;
        this.stop();
        this.cronTime = time;
        if (time.realDate)
            this.runOnce = true;
        if (wasRunning)
            this.start();
    }
    nextDate() {
        return this.cronTime.sendAt();
    }
    fireOnTick() {
        for (const callback of this._callbacks) {
            void callback.call(this.context, this.onComplete);
        }
    }
    nextDates(i) {
        return this.cronTime.sendAt(i !== null && i !== void 0 ? i : 0);
    }
    start() {
        if (this.running) {
            return;
        }
        const MAXDELAY = 2147483647;
        let timeout = this.cronTime.getTimeout();
        let remaining = 0;
        let startTime;
        const setCronTimeout = (t) => {
            startTime = Date.now();
            this._timeout = setTimeout(callbackWrapper, t);
            if (this.unrefTimeout && typeof this._timeout.unref === 'function') {
                this._timeout.unref();
            }
        };
        const callbackWrapper = () => {
            const diff = startTime + timeout - Date.now();
            if (diff > 0) {
                let newTimeout = this.cronTime.getTimeout();
                if (newTimeout > diff) {
                    newTimeout = diff;
                }
                remaining += newTimeout;
            }
            if (remaining) {
                if (remaining > MAXDELAY) {
                    remaining -= MAXDELAY;
                    timeout = MAXDELAY;
                }
                else {
                    timeout = remaining;
                    remaining = 0;
                }
                setCronTimeout(timeout);
            }
            else {
                this.lastExecution = new Date();
                this.running = false;
                if (!this.runOnce) {
                    this.start();
                }
                this.fireOnTick();
            }
        };
        if (timeout >= 0) {
            this.running = true;
            if (timeout > MAXDELAY) {
                remaining = timeout - MAXDELAY;
                timeout = MAXDELAY;
            }
            setCronTimeout(timeout);
        }
        else {
            this.stop();
        }
    }
    lastDate() {
        return this.lastExecution;
    }
    stop() {
        if (this._timeout)
            clearTimeout(this._timeout);
        this.running = false;
        if (typeof this.onComplete === 'function') {
            void this.onComplete.call(this.context);
        }
    }
}
exports.CronJob = CronJob;
//# sourceMappingURL=job.js.map