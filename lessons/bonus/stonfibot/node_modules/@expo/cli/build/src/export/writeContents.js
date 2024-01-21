"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.createAssetMap = createAssetMap;
exports.createSourceMapDebugHtml = createSourceMapDebugHtml;
function createAssetMap({ assets  }) {
    // Convert the assets array to a k/v pair where the asset hash is the key and the asset is the value.
    return Object.fromEntries(assets.map((asset)=>[
            asset.hash,
            asset
        ]
    ));
}
function createSourceMapDebugHtml({ fileNames  }) {
    // Make a debug html so user can debug their bundles
    return `
      ${fileNames.filter((value)=>value != null
    ).map((fileName)=>`<script src="${fileName}"></script>`
    ).join("\n      ")}
      Open up this file in Chrome. In the JavaScript developer console, navigate to the Source tab.
      You can see a red colored folder containing the original source code from your bundle.
      `;
}

//# sourceMappingURL=writeContents.js.map