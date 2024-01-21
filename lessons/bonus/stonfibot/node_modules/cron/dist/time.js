"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronTime = void 0;
const luxon_1 = require("luxon");
const constants_1 = require("./constants");
const errors_1 = require("./errors");
const utils_1 = require("./utils");
class CronTime {
    constructor(source, timeZone, utcOffset) {
        this.realDate = false;
        this.second = {};
        this.minute = {};
        this.hour = {};
        this.dayOfMonth = {};
        this.month = {};
        this.dayOfWeek = {};
        if (timeZone != null && utcOffset != null) {
            throw new errors_1.ExclusiveParametersError('timeZone', 'utcOffset');
        }
        if (timeZone) {
            const dt = luxon_1.DateTime.fromObject({}, { zone: timeZone });
            if (!dt.isValid) {
                throw new errors_1.CronError('Invalid timezone.');
            }
            this.timeZone = timeZone;
        }
        if (utcOffset != null) {
            this.utcOffset = utcOffset;
        }
        if (source instanceof Date || source instanceof luxon_1.DateTime) {
            this.source =
                source instanceof Date ? luxon_1.DateTime.fromJSDate(source) : source;
            this.realDate = true;
        }
        else {
            this.source = source;
            this._parse(this.source);
            this._verifyParse();
        }
    }
    _getWeekDay(date) {
        return date.weekday === 7 ? 0 : date.weekday;
    }
    _verifyParse() {
        const months = (0, utils_1.getRecordKeys)(this.month);
        const daysOfMonth = (0, utils_1.getRecordKeys)(this.dayOfMonth);
        let isOk = false;
        let lastWrongMonth = null;
        for (const m of months) {
            const con = constants_1.MONTH_CONSTRAINTS[m];
            for (const day of daysOfMonth) {
                if (day <= con) {
                    isOk = true;
                }
            }
            if (!isOk) {
                lastWrongMonth = m;
                console.warn(`Month '${m}' is limited to '${con}' days.`);
            }
        }
        if (!isOk && lastWrongMonth !== null) {
            const notOkCon = constants_1.MONTH_CONSTRAINTS[lastWrongMonth];
            for (const notOkDay of daysOfMonth) {
                if (notOkDay > notOkCon) {
                    delete this.dayOfMonth[notOkDay];
                    const fixedDay = (notOkDay % notOkCon);
                    this.dayOfMonth[fixedDay] = true;
                }
            }
        }
    }
    sendAt(i) {
        let date = this.realDate && this.source instanceof luxon_1.DateTime
            ? this.source
            : luxon_1.DateTime.local();
        if (this.timeZone) {
            date = date.setZone(this.timeZone);
        }
        if (this.utcOffset !== undefined) {
            const sign = this.utcOffset < 0 ? '-' : '+';
            const offsetHours = Math.trunc(this.utcOffset / 60);
            const offsetHoursStr = String(Math.abs(offsetHours)).padStart(2, '0');
            const offsetMins = Math.abs(this.utcOffset - offsetHours * 60);
            const offsetMinsStr = String(offsetMins).padStart(2, '0');
            const utcZone = `UTC${sign}${offsetHoursStr}:${offsetMinsStr}`;
            date = date.setZone(utcZone);
            if (!date.isValid) {
                throw new errors_1.CronError('ERROR: You specified an invalid UTC offset.');
            }
        }
        if (this.realDate) {
            if (luxon_1.DateTime.local() > date) {
                throw new errors_1.CronError('WARNING: Date in past. Will never be fired.');
            }
            return date;
        }
        if (i === undefined || isNaN(i) || i < 0) {
            return this.getNextDateFrom(date);
        }
        else {
            const dates = [];
            for (; i > 0; i--) {
                date = this.getNextDateFrom(date);
                dates.push(date);
            }
            return dates;
        }
    }
    getTimeout() {
        return Math.max(-1, this.sendAt().toMillis() - luxon_1.DateTime.local().toMillis());
    }
    toString() {
        return this.toJSON().join(' ');
    }
    toJSON() {
        return constants_1.TIME_UNITS.map(unit => {
            return this._wcOrAll(unit);
        });
    }
    getNextDateFrom(start, timeZone) {
        var _a;
        if (start instanceof Date) {
            start = luxon_1.DateTime.fromJSDate(start);
        }
        let date = start;
        const firstDate = start.toMillis();
        if (timeZone) {
            date = date.setZone(timeZone);
        }
        if (!this.realDate) {
            if (date.millisecond > 0) {
                date = date.set({ millisecond: 0, second: date.second + 1 });
            }
        }
        if (!date.isValid) {
            throw new errors_1.CronError('ERROR: You specified an invalid date.');
        }
        const maxMatch = luxon_1.DateTime.now().plus({ years: 8 });
        while (true) {
            const diff = date.toMillis() - start.toMillis();
            if (date > maxMatch) {
                throw new errors_1.CronError(`Something went wrong. No execution date was found in the next 8 years.
							Please provide the following string if you would like to help debug:
							Time Zone: ${(_a = timeZone === null || timeZone === void 0 ? void 0 : timeZone.toString()) !== null && _a !== void 0 ? _a : '""'} - Cron String: ${this.source.toString()} - UTC offset: ${date.offset} - current Date: ${luxon_1.DateTime.local().toString()}`);
            }
            if (!(date.month in this.month) &&
                Object.keys(this.month).length !== 12) {
                date = date.plus({ months: 1 });
                date = date.set({ day: 1, hour: 0, minute: 0, second: 0 });
                if (this._forwardDSTJump(0, 0, date)) {
                    const [isDone, newDate] = this._findPreviousDSTJump(date);
                    date = newDate;
                    if (isDone)
                        break;
                }
                continue;
            }
            if (!(date.day in this.dayOfMonth) &&
                Object.keys(this.dayOfMonth).length !== 31 &&
                !(this._getWeekDay(date) in this.dayOfWeek &&
                    Object.keys(this.dayOfWeek).length !== 7)) {
                date = date.plus({ days: 1 });
                date = date.set({ hour: 0, minute: 0, second: 0 });
                if (this._forwardDSTJump(0, 0, date)) {
                    const [isDone, newDate] = this._findPreviousDSTJump(date);
                    date = newDate;
                    if (isDone)
                        break;
                }
                continue;
            }
            if (!(this._getWeekDay(date) in this.dayOfWeek) &&
                Object.keys(this.dayOfWeek).length !== 7 &&
                !(date.day in this.dayOfMonth &&
                    Object.keys(this.dayOfMonth).length !== 31)) {
                date = date.plus({ days: 1 });
                date = date.set({ hour: 0, minute: 0, second: 0 });
                if (this._forwardDSTJump(0, 0, date)) {
                    const [isDone, newDate] = this._findPreviousDSTJump(date);
                    date = newDate;
                    if (isDone)
                        break;
                }
                continue;
            }
            if (!(date.hour in this.hour) && Object.keys(this.hour).length !== 24) {
                const expectedHour = date.hour === 23 && diff > 86400000 ? 0 : date.hour + 1;
                const expectedMinute = date.minute;
                date = date.set({ hour: expectedHour });
                date = date.set({ minute: 0, second: 0 });
                if (this._forwardDSTJump(expectedHour, expectedMinute, date)) {
                    const [isDone, newDate] = this._findPreviousDSTJump(date);
                    date = newDate;
                    if (isDone)
                        break;
                }
                continue;
            }
            if (!(date.minute in this.minute) &&
                Object.keys(this.minute).length !== 60) {
                const expectedMinute = date.minute === 59 && diff > 3600000 ? 0 : date.minute + 1;
                const expectedHour = date.hour + (expectedMinute === 60 ? 1 : 0);
                date = date.set({ minute: expectedMinute });
                date = date.set({ second: 0 });
                if (this._forwardDSTJump(expectedHour, expectedMinute, date)) {
                    const [isDone, newDate] = this._findPreviousDSTJump(date);
                    date = newDate;
                    if (isDone)
                        break;
                }
                continue;
            }
            if (!(date.second in this.second) &&
                Object.keys(this.second).length !== 60) {
                const expectedSecond = date.second === 59 && diff > 60000 ? 0 : date.second + 1;
                const expectedMinute = date.minute + (expectedSecond === 60 ? 1 : 0);
                const expectedHour = date.hour + (expectedMinute === 60 ? 1 : 0);
                date = date.set({ second: expectedSecond });
                if (this._forwardDSTJump(expectedHour, expectedMinute, date)) {
                    const [isDone, newDate] = this._findPreviousDSTJump(date);
                    date = newDate;
                    if (isDone)
                        break;
                }
                continue;
            }
            if (date.toMillis() === firstDate) {
                const expectedSecond = date.second + 1;
                const expectedMinute = date.minute + (expectedSecond === 60 ? 1 : 0);
                const expectedHour = date.hour + (expectedMinute === 60 ? 1 : 0);
                date = date.set({ second: expectedSecond });
                if (this._forwardDSTJump(expectedHour, expectedMinute, date)) {
                    const [isDone, newDate] = this._findPreviousDSTJump(date);
                    date = newDate;
                    if (isDone)
                        break;
                }
                continue;
            }
            break;
        }
        return date;
    }
    _findPreviousDSTJump(date) {
        var _a;
        let expectedMinute, expectedHour, actualMinute, actualHour;
        let maybeJumpingPoint = date;
        const iterationLimit = 60 * 24;
        let iteration = 0;
        do {
            if (++iteration > iterationLimit) {
                throw new errors_1.CronError(`ERROR: This DST checking related function assumes the input DateTime (${(_a = date.toISO()) !== null && _a !== void 0 ? _a : date.toMillis()}) is within 24 hours of a DST jump.`);
            }
            expectedMinute = maybeJumpingPoint.minute - 1;
            expectedHour = maybeJumpingPoint.hour;
            if (expectedMinute < 0) {
                expectedMinute += 60;
                expectedHour = (expectedHour + 24 - 1) % 24;
            }
            maybeJumpingPoint = maybeJumpingPoint.minus({ minute: 1 });
            actualMinute = maybeJumpingPoint.minute;
            actualHour = maybeJumpingPoint.hour;
        } while (expectedMinute === actualMinute && expectedHour === actualHour);
        const afterJumpingPoint = maybeJumpingPoint
            .plus({ minute: 1 })
            .set({ second: 0, millisecond: 0 });
        const beforeJumpingPoint = afterJumpingPoint.minus({ second: 1 });
        if (date.month + 1 in this.month &&
            date.day in this.dayOfMonth &&
            this._getWeekDay(date) in this.dayOfWeek) {
            return [
                this._checkTimeInSkippedRange(beforeJumpingPoint, afterJumpingPoint),
                afterJumpingPoint
            ];
        }
        return [false, afterJumpingPoint];
    }
    _checkTimeInSkippedRange(beforeJumpingPoint, afterJumpingPoint) {
        const startingMinute = (beforeJumpingPoint.minute + 1) % 60;
        const startingHour = (beforeJumpingPoint.hour + (startingMinute === 0 ? 1 : 0)) % 24;
        const hourRangeSize = afterJumpingPoint.hour - startingHour + 1;
        const isHourJump = startingMinute === 0 && afterJumpingPoint.minute === 0;
        if (hourRangeSize === 2 && isHourJump) {
            return startingHour in this.hour;
        }
        else if (hourRangeSize === 1) {
            return (startingHour in this.hour &&
                this._checkTimeInSkippedRangeSingleHour(startingMinute, afterJumpingPoint.minute));
        }
        else {
            return this._checkTimeInSkippedRangeMultiHour(startingHour, startingMinute, afterJumpingPoint.hour, afterJumpingPoint.minute);
        }
    }
    _checkTimeInSkippedRangeSingleHour(startMinute, endMinute) {
        for (let minute = startMinute; minute < endMinute; ++minute) {
            if (minute in this.minute)
                return true;
        }
        return endMinute in this.minute && 0 in this.second;
    }
    _checkTimeInSkippedRangeMultiHour(startHour, startMinute, endHour, endMinute) {
        if (startHour >= endHour) {
            throw new errors_1.CronError(`ERROR: This DST checking related function assumes the forward jump starting hour (${startHour}) is less than the end hour (${endHour})`);
        }
        const firstHourMinuteRange = Array.from({ length: 60 - startMinute }, (_, k) => startMinute + k);
        const lastHourMinuteRange = Array.from({ length: endMinute }, (_, k) => k);
        const middleHourMinuteRange = Array.from({ length: 60 }, (_, k) => k);
        const selectRange = (forHour) => {
            if (forHour === startHour) {
                return firstHourMinuteRange;
            }
            else if (forHour === endHour) {
                return lastHourMinuteRange;
            }
            else {
                return middleHourMinuteRange;
            }
        };
        for (let hour = startHour; hour <= endHour; ++hour) {
            if (!(hour in this.hour))
                continue;
            const usingRange = selectRange(hour);
            for (const minute of usingRange) {
                if (minute in this.minute)
                    return true;
            }
        }
        return endHour in this.hour && endMinute in this.minute && 0 in this.second;
    }
    _forwardDSTJump(expectedHour, expectedMinute, actualDate) {
        const actualHour = actualDate.hour;
        const actualMinute = actualDate.minute;
        const didHoursJumped = expectedHour % 24 < actualHour;
        const didMinutesJumped = expectedMinute % 60 < actualMinute;
        return didHoursJumped || didMinutesJumped;
    }
    _wcOrAll(unit) {
        if (this._hasAll(unit)) {
            return '*';
        }
        const all = [];
        for (const time in this[unit]) {
            all.push(time);
        }
        return all.join(',');
    }
    _hasAll(unit) {
        const constraints = constants_1.CONSTRAINTS[unit];
        const low = constraints[0];
        const high = unit === constants_1.TIME_UNITS_MAP.DAY_OF_WEEK ? constraints[1] - 1 : constraints[1];
        for (let i = low, n = high; i < n; i++) {
            if (!(i in this[unit])) {
                return false;
            }
        }
        return true;
    }
    _parse(source) {
        var _a;
        source = source.toLowerCase();
        if (Object.keys(constants_1.PRESETS).includes(source)) {
            source = constants_1.PRESETS[source];
        }
        source = source.replace(/[a-z]{1,3}/gi, (alias) => {
            if (Object.keys(constants_1.ALIASES).includes(alias)) {
                return constants_1.ALIASES[alias].toString();
            }
            throw new errors_1.CronError(`Unknown alias: ${alias}`);
        });
        const units = source.trim().split(/\s+/);
        if (units.length < constants_1.TIME_UNITS_LEN - 1) {
            throw new errors_1.CronError('Too few fields');
        }
        if (units.length > constants_1.TIME_UNITS_LEN) {
            throw new errors_1.CronError('Too many fields');
        }
        const unitsLen = units.length;
        for (const unit of constants_1.TIME_UNITS) {
            const i = constants_1.TIME_UNITS.indexOf(unit);
            const cur = (_a = units[i - (constants_1.TIME_UNITS_LEN - unitsLen)]) !== null && _a !== void 0 ? _a : constants_1.PARSE_DEFAULTS[unit];
            this._parseField(cur, unit);
        }
    }
    _parseField(value, unit) {
        const typeObj = this[unit];
        let pointer;
        const constraints = constants_1.CONSTRAINTS[unit];
        const low = constraints[0];
        const high = constraints[1];
        const fields = value.split(',');
        fields.forEach(field => {
            const wildcardIndex = field.indexOf('*');
            if (wildcardIndex !== -1 && wildcardIndex !== 0) {
                throw new errors_1.CronError(`Field (${field}) has an invalid wildcard expression`);
            }
        });
        value = value.replace(constants_1.RE_WILDCARDS, `${low}-${high}`);
        const allRanges = value.split(',');
        for (const range of allRanges) {
            const match = [...range.matchAll(constants_1.RE_RANGE)][0];
            if ((match === null || match === void 0 ? void 0 : match[1]) !== undefined) {
                const [, mLower, mUpper, mStep] = match;
                let lower = parseInt(mLower, 10);
                let upper = mUpper !== undefined ? parseInt(mUpper, 10) : undefined;
                const wasStepDefined = mStep !== undefined;
                const step = parseInt(mStep !== null && mStep !== void 0 ? mStep : '1', 10);
                if (step === 0) {
                    throw new errors_1.CronError(`Field (${unit}) has a step of zero`);
                }
                if (upper !== undefined && lower > upper) {
                    throw new errors_1.CronError(`Field (${unit}) has an invalid range`);
                }
                const isOutOfRange = lower < low ||
                    (upper !== undefined && upper > high) ||
                    (upper === undefined && lower > high);
                if (isOutOfRange) {
                    throw new errors_1.CronError(`Field value (${value}) is out of range`);
                }
                lower = Math.min(Math.max(low, ~~Math.abs(lower)), high);
                if (upper !== undefined) {
                    upper = Math.min(high, ~~Math.abs(upper));
                }
                else {
                    upper = wasStepDefined ? high : lower;
                }
                pointer = lower;
                do {
                    typeObj[pointer] = true;
                    pointer += step;
                } while (pointer <= upper);
                if (unit === 'dayOfWeek') {
                    if (!typeObj[0] && !!typeObj[7])
                        typeObj[0] = typeObj[7];
                    delete typeObj[7];
                }
            }
            else {
                throw new errors_1.CronError(`Field (${unit}) cannot be parsed`);
            }
        }
    }
}
exports.CronTime = CronTime;
//# sourceMappingURL=time.js.map