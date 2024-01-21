"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.persistMetroAssetsAsync = persistMetroAssetsAsync;
exports.copyInBatchesAsync = copyInBatchesAsync;
exports.filterPlatformAssetScales = filterPlatformAssetScales;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _metroAssetLocalPath = require("./metroAssetLocalPath");
var _log = require("../log");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function cleanAssetCatalog(catalogDir) {
    const files = _fs.default.readdirSync(catalogDir).filter((file)=>file.endsWith(".imageset")
    );
    for (const file1 of files){
        _fs.default.rmSync(_path.default.join(catalogDir, file1));
    }
}
async function persistMetroAssetsAsync(assets, { platform , outputDirectory , baseUrl , iosAssetCatalogDirectory , files  }) {
    if (outputDirectory == null) {
        _log.Log.warn("Assets destination folder is not set, skipping...");
        return;
    }
    let assetsToCopy = [];
    // TODO: Use `files` as below to defer writing files
    if (platform === "ios" && iosAssetCatalogDirectory != null) {
        // Use iOS Asset Catalog for images. This will allow Apple app thinning to
        // remove unused scales from the optimized bundle.
        const catalogDir = _path.default.join(iosAssetCatalogDirectory, "RNAssets.xcassets");
        if (!_fs.default.existsSync(catalogDir)) {
            _log.Log.error(`Could not find asset catalog 'RNAssets.xcassets' in ${iosAssetCatalogDirectory}. Make sure to create it if it does not exist.`);
            return;
        }
        _log.Log.log("Adding images to asset catalog", catalogDir);
        cleanAssetCatalog(catalogDir);
        for (const asset of assets){
            if (isCatalogAsset(asset)) {
                const imageSet = getImageSet(catalogDir, asset, filterPlatformAssetScales(platform, asset.scales));
                writeImageSet(imageSet);
            } else {
                assetsToCopy.push(asset);
            }
        }
        _log.Log.log("Done adding images to asset catalog");
    } else {
        assetsToCopy = [
            ...assets
        ];
    }
    const batches = {};
    async function write(src, dest) {
        if (files) {
            const data = await _fs.default.promises.readFile(src);
            files.set(dest, {
                contents: data,
                targetDomain: platform === "web" ? "client" : undefined
            });
        } else {
            batches[src] = _path.default.join(outputDirectory, dest);
        }
    }
    for (const asset of assetsToCopy){
        const validScales = new Set(filterPlatformAssetScales(platform, asset.scales));
        for(let idx = 0; idx < asset.scales.length; idx++){
            const scale = asset.scales[idx];
            if (validScales.has(scale)) {
                await write(asset.files[idx], (0, _metroAssetLocalPath).getAssetLocalPath(asset, {
                    platform,
                    scale,
                    baseUrl
                }));
            }
        }
    }
    if (!files) {
        await copyInBatchesAsync(batches);
    }
}
function writeImageSet(imageSet) {
    _fs.default.mkdirSync(imageSet.baseUrl, {
        recursive: true
    });
    for (const file2 of imageSet.files){
        const dest = _path.default.join(imageSet.baseUrl, file2.name);
        _fs.default.copyFileSync(file2.src, dest);
    }
    _fs.default.writeFileSync(_path.default.join(imageSet.baseUrl, "Contents.json"), JSON.stringify({
        images: imageSet.files.map((file)=>({
                filename: file.name,
                idiom: "universal",
                scale: `${file.scale}x`
            })
        ),
        info: {
            author: "expo",
            version: 1
        }
    }));
}
function isCatalogAsset(asset) {
    return asset.type === "png" || asset.type === "jpg" || asset.type === "jpeg";
}
function getImageSet(catalogDir, asset, scales) {
    const fileName = getResourceIdentifier(asset);
    return {
        baseUrl: _path.default.join(catalogDir, `${fileName}.imageset`),
        files: scales.map((scale, idx)=>{
            const suffix = scale === 1 ? "" : `@${scale}x`;
            return {
                name: `${fileName + suffix}.${asset.type}`,
                scale,
                src: asset.files[idx]
            };
        })
    };
}
function copyInBatchesAsync(filesToCopy) {
    const queue = Object.keys(filesToCopy);
    if (queue.length === 0) {
        return;
    }
    _log.Log.log(`Copying ${queue.length} asset files`);
    return new Promise((resolve, reject)=>{
        const copyNext = (error)=>{
            if (error) {
                return reject(error);
            }
            if (queue.length) {
                // queue.length === 0 is checked in previous branch, so this is string
                const src = queue.shift();
                const dest = filesToCopy[src];
                copy(src, dest, copyNext);
            } else {
                resolve();
            }
        };
        copyNext();
    });
}
function copy(src, dest, callback) {
    _fs.default.mkdir(_path.default.dirname(dest), {
        recursive: true
    }, (err)=>{
        if (err) {
            callback(err);
            return;
        }
        _fs.default.createReadStream(src).pipe(_fs.default.createWriteStream(dest)).on("finish", callback);
    });
}
const ALLOWED_SCALES = {
    ios: [
        1,
        2,
        3
    ]
};
function filterPlatformAssetScales(platform, scales) {
    const whitelist = ALLOWED_SCALES[platform];
    if (!whitelist) {
        return scales;
    }
    const result = scales.filter((scale)=>whitelist.includes(scale)
    );
    if (!result.length && scales.length) {
        // No matching scale found, but there are some available. Ideally we don't
        // want to be in this situation and should throw, but for now as a fallback
        // let's just use the closest larger image
        const maxScale = whitelist[whitelist.length - 1];
        for (const scale of scales){
            if (scale > maxScale) {
                result.push(scale);
                break;
            }
        }
        // There is no larger scales available, use the largest we have
        if (!result.length) {
            result.push(scales[scales.length - 1]);
        }
    }
    return result;
}
function getResourceIdentifier(asset) {
    const folderPath = getBaseUrl(asset);
    return `${folderPath}/${asset.name}`.toLowerCase().replace(/\//g, "_") // Encode folder structure in file name
    .replace(/([^a-z0-9_])/g, "") // Remove illegal chars
    .replace(/^assets_/, ""); // Remove "assets_" prefix
}
function getBaseUrl(asset) {
    let baseUrl = asset.httpServerLocation;
    if (baseUrl[0] === "/") {
        baseUrl = baseUrl.substring(1);
    }
    return baseUrl;
}

//# sourceMappingURL=persistMetroAssets.js.map