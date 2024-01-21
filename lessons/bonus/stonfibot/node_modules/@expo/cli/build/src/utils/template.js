"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.unsafeTemplate = unsafeTemplate;
function unsafeTemplate(strings, ...keys) {
    return (...values)=>{
        const lastValue = values[values.length - 1];
        const dict = typeof lastValue === "object" ? lastValue : {};
        const result = [
            strings[0]
        ];
        keys.forEach((key, i)=>{
            const value = typeof key === "number" && Number.isInteger(key) ? values[key] : dict[key];
            result.push(value, strings[i + 1]);
        });
        return result.join("");
    };
}

//# sourceMappingURL=template.js.map