"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.serializeHtmlWithAssets = serializeHtmlWithAssets;
const debug = require("debug")("expo:metro:html");
function serializeHtmlWithAssets({ mode , resources , template , devBundleUrl , baseUrl , route  }) {
    if (!resources) {
        return "";
    }
    const isDev = mode === "development";
    return htmlFromSerialAssets(resources, {
        dev: isDev,
        template,
        baseUrl,
        bundleUrl: isDev ? devBundleUrl : undefined,
        route
    });
}
function htmlFromSerialAssets(assets, { dev , template , baseUrl , bundleUrl , route  }) {
    // Combine the CSS modules into tags that have hot refresh data attributes.
    const styleString = assets.filter((asset)=>asset.type === "css"
    ).map(({ metadata , filename , source  })=>{
        if (dev) {
            return `<style data-expo-css-hmr="${metadata.hmrId}">` + source + "\n</style>";
        } else {
            return [
                `<link rel="preload" href="${baseUrl}/${filename}" as="style">`,
                `<link rel="stylesheet" href="${baseUrl}/${filename}">`, 
            ].join("");
        }
    }).join("");
    const jsAssets = assets.filter((asset)=>asset.type === "js"
    );
    const scripts = bundleUrl ? `<script src="${bundleUrl}" defer></script>` : jsAssets.map(({ filename , metadata  })=>{
        // TODO: Mark dependencies of the HTML and include them to prevent waterfalls.
        if (metadata.isAsync) {
            // We have the data required to match async chunks to the route's HTML file.
            if ((route == null ? void 0 : route.entryPoints) && metadata.modulePaths && Array.isArray(route.entryPoints) && Array.isArray(metadata.modulePaths)) {
                // TODO: Handle module IDs like `expo-router/build/views/Unmatched.js`
                const doesAsyncChunkContainRouteEntryPoint = route.entryPoints.some((entryPoint)=>metadata.modulePaths.includes(entryPoint)
                );
                if (!doesAsyncChunkContainRouteEntryPoint) {
                    return "";
                }
                debug("Linking async chunk %s to HTML for route %s", filename, route.contextKey);
            // Pass through to the next condition.
            } else {
                return "";
            }
        // Mark async chunks as defer so they don't block the page load.
        // return `<script src="${baseUrl}/${filename}" defer></script>`;
        }
        return `<script src="${baseUrl}/${filename}" defer></script>`;
    }).join("");
    return template.replace("</head>", `${styleString}</head>`).replace("</body>", `${scripts}\n</body>`);
}

//# sourceMappingURL=serializeHtml.js.map