"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = _default;
var _promises = require("fs/promises");
var _path = require("path");
var _routes = require("../routes");
const fixtures = {
    basic: {
        staticRoutes: [
            "/apple",
            "/banana"
        ],
        dynamicRoutes: [
            "/colors/${SingleRoutePart<T>}",
            "/animals/${CatchAllRoutePart<T>}",
            "/mix/${SingleRoutePart<T>}/${SingleRoutePart<T>}/${CatchAllRoutePart<T>}", 
        ],
        dynamicRouteTemplates: [
            "/colors/[color]",
            "/animals/[...animal]",
            "/mix/[fruit]/[color]/[...animals]", 
        ]
    }
};
async function _default() {
    await Promise.all(Object.entries(fixtures).map(async ([key, value])=>{
        const template = (0, _routes).getTemplateString(new Set(value.staticRoutes), new Set(value.dynamicRoutes), new Set(value.dynamicRouteTemplates))// The Template produces a global module .d.ts declaration
        // These replacements turn it into a local module
        .replaceAll(/^  /gm, "").replace(/declare module "expo-router" {/, "").replaceAll(/export function/g, "export declare function").replaceAll(/export const/g, "export declare const")// Remove the last `}`
        .slice(0, -2);
        return (0, _promises).writeFile((0, _path).join(__dirname, "./fixtures/", key + ".ts"), template);
    }));
    console.log("done");
}

//# sourceMappingURL=generateFixtures.js.map