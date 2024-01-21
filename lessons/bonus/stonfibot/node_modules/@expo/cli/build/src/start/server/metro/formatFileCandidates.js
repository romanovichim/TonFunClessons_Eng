"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.formatFileCandidates = formatFileCandidates;
var _path = _interopRequireDefault(require("path"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function groupExtensions(exts) {
    // Reverse the extensions and split into parts
    const extParts = exts.map((ext)=>ext.split(".").reverse()
    );
    // Find the maximum depth of extension parts
    const maxDepth = Math.max(...extParts.map((parts)=>parts.length
    ));
    // Initialize groups based on the max depth
    const groups = Array.from({
        length: maxDepth
    }, ()=>new Set()
    );
    extParts.forEach((parts)=>{
        parts.forEach((part, i)=>{
            // Add parts to the corresponding group based on their depth
            groups[i].add(part);
        });
    });
    // Cycle groups and remove duplicates that appear forwards
    groups.forEach((group, index)=>{
        // Remove duplicates that appear forwards
        // NOTE: This doesn't support extensions like `.native.native.js`
        groups.forEach((otherGroup, otherIndex)=>{
            if (index < otherIndex) {
                otherGroup.forEach((part)=>group.delete(part)
                );
            }
        });
    });
    // Convert sets back to arrays and reverse groups to correct order
    return groups.map((group)=>Array.from(group)
    ).reverse();
}
function createMatcherPatternForExtensions(exts) {
    let formatted = "";
    if (exts.length) {
        // Apply grouping function
        const groups = groupExtensions(exts);
        formatted += groups.map((group, index)=>{
            return index < groups.length - 1 ? `(${group.map((ext)=>`.${ext}`
            ).join("|")})?` : `.(${group.join("|")})`;
        }).join("");
    }
    return formatted;
}
function formatFileCandidates(candidates, allowIndex = false) {
    if (candidates.type === "asset") {
        return candidates.name;
    }
    let formatted = candidates.filePathPrefix;
    if (allowIndex) {
        formatted += `(${_path.default.sep}index)?`;
    }
    const extensions = candidates.candidateExts// Drop additional dots, the first character if it is a dot, and remove empty strings.
    .map((ext)=>ext.replace(/\.+/g, ".").replace(/^\./g, "")
    ).filter(Boolean);
    formatted += createMatcherPatternForExtensions(extensions);
    return formatted;
}

//# sourceMappingURL=formatFileCandidates.js.map