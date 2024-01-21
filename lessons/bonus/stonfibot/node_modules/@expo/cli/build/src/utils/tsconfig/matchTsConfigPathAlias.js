"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.matchTsConfigPathAlias = matchTsConfigPathAlias;
const asterisk = 42;
function hasZeroOrOneAsteriskCharacter(str) {
    let seenAsterisk = false;
    for(let i = 0; i < str.length; i++){
        if (str.charCodeAt(i) === asterisk) {
            if (!seenAsterisk) {
                seenAsterisk = true;
            } else {
                return false;
            }
        }
    }
    return true;
}
function tryParsePattern(pattern) {
    // This should be verified outside of here and a proper error thrown.
    const indexOfStar = pattern.indexOf("*");
    return indexOfStar === -1 ? undefined : {
        prefix: pattern.slice(0, indexOfStar),
        suffix: pattern.slice(indexOfStar + 1)
    };
}
function isPatternMatch({ prefix , suffix  }, candidate) {
    return candidate.length >= prefix.length + suffix.length && candidate.startsWith(prefix) && candidate.endsWith(suffix);
}
/**
 * Return the object corresponding to the best pattern to match `candidate`.
 *
 * @internal
 */ function findBestPatternMatch(values, getPattern, candidate) {
    let matchedValue;
    // use length of prefix as betterness criteria
    let longestMatchPrefixLength = -1;
    for (const v of values){
        const pattern = getPattern(v);
        if (isPatternMatch(pattern, candidate) && pattern.prefix.length > longestMatchPrefixLength) {
            longestMatchPrefixLength = pattern.prefix.length;
            matchedValue = v;
        }
    }
    return matchedValue;
}
/**
 * patternStrings contains both pattern strings (containing "*") and regular strings.
 * Return an exact match if possible, or a pattern match, or undefined.
 * (These are verified by verifyCompilerOptions to have 0 or 1 "*" characters.)
 */ function matchPatternOrExact(patternStrings, candidate) {
    const patterns = [];
    for (const patternString of patternStrings){
        if (!hasZeroOrOneAsteriskCharacter(patternString)) continue;
        const pattern = tryParsePattern(patternString);
        if (pattern) {
            patterns.push(pattern);
        } else if (patternString === candidate) {
            // pattern was matched as is - no need to search further
            return patternString;
        }
    }
    return findBestPatternMatch(patterns, (_)=>_
    , candidate);
}
/**
 * Given that candidate matches pattern, returns the text matching the '*'.
 * E.g.: matchedText(tryParsePattern("foo*baz"), "foobarbaz") === "bar"
 */ function matchedText(pattern, candidate) {
    return candidate.substring(pattern.prefix.length, candidate.length - pattern.suffix.length);
}
function getStar(matchedPattern, moduleName) {
    return typeof matchedPattern === "string" ? undefined : matchedText(matchedPattern, moduleName);
}
function matchTsConfigPathAlias(pathsKeys, moduleName) {
    // If the module name does not match any of the patterns in `paths` we hand off resolving to webpack
    const matchedPattern = matchPatternOrExact(pathsKeys, moduleName);
    if (!matchedPattern) {
        return null;
    }
    return {
        star: getStar(matchedPattern, moduleName),
        text: typeof matchedPattern === "string" ? matchedPattern : `${matchedPattern.prefix}*${matchedPattern.suffix}`
    };
}

//# sourceMappingURL=matchTsConfigPathAlias.js.map