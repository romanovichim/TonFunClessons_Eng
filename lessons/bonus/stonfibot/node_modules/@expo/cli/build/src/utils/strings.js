"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.joinWithCommasAnd = joinWithCommasAnd;
function joinWithCommasAnd(items, limit = 10) {
    if (!items.length) {
        return "";
    }
    const uniqueItems = items.filter((value, index, array)=>array.indexOf(value) === index
    );
    if (uniqueItems.length === 1) {
        return uniqueItems[0];
    }
    if (limit && uniqueItems.length > limit) {
        const first = uniqueItems.slice(0, limit);
        const remaining = uniqueItems.length - limit;
        return `${first.join(", ")}, and ${remaining} ${remaining > 1 ? "others" : "other"}`;
    }
    const last = uniqueItems.pop();
    return `${uniqueItems.join(", ")}${uniqueItems.length >= 2 ? "," : ""} and ${last}`;
}

//# sourceMappingURL=strings.js.map