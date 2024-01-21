"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.assetPatternsToBeBundled = assetPatternsToBeBundled;
exports.resolveAssetPatternsToBeBundled = resolveAssetPatternsToBeBundled;
exports.exportAssetsAsync = exportAssetsAsync;
var _fs = _interopRequireDefault(require("fs"));
var _minimatch = _interopRequireDefault(require("minimatch"));
var _path = _interopRequireDefault(require("path"));
var _persistMetroAssets = require("./persistMetroAssets");
var Log = _interopRequireWildcard(require("../log"));
var _resolveAssets = require("../start/server/middleware/resolveAssets");
var _array = require("../utils/array");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    } else {
        var newObj = {};
        if (obj != null) {
            for(var key in obj){
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};
                    if (desc.get || desc.set) {
                        Object.defineProperty(newObj, key, desc);
                    } else {
                        newObj[key] = obj[key];
                    }
                }
            }
        }
        newObj.default = obj;
        return newObj;
    }
}
const debug = require("debug")("expo:export:exportAssets");
function mapAssetHashToAssetString(asset, hash) {
    return "asset_" + hash + ("type" in asset && asset.type ? "." + asset.type : "");
}
function assetPatternsToBeBundled(exp) {
    var ref, ref1, ref2, ref3, ref4;
    return (exp == null ? void 0 : (ref = exp.extra) == null ? void 0 : (ref1 = ref.updates) == null ? void 0 : (ref2 = ref1.assetPatternsToBeBundled) == null ? void 0 : ref2.length) ? exp == null ? void 0 : (ref3 = exp.extra) == null ? void 0 : (ref4 = ref3.updates) == null ? void 0 : ref4.assetPatternsToBeBundled : undefined;
}
/**
 * Given an asset and a set of strings representing the assets to be bundled, returns true if
 * the asset is part of the set to be bundled.
 * @param asset Asset object
 * @param bundledAssetsSet Set of strings
 * @returns true if the asset should be bundled
 */ function assetShouldBeIncludedInExport(asset, bundledAssetsSet) {
    if (!bundledAssetsSet) {
        return true;
    }
    return asset.fileHashes.filter((hash)=>bundledAssetsSet.has(mapAssetHashToAssetString(asset, hash))
    ).length > 0;
}
/**
 * Computes a set of strings representing the assets to be bundled with an export, given an array of assets,
 * and a set of patterns to match
 * @param assets The asset array
 * @param assetPatternsToBeBundled An array of strings with glob patterns to match
 * @param projectRoot The project root
 * @returns A set of asset strings
 */ function setOfAssetsToBeBundled(assets, assetPatternsToBeBundled1, projectRoot) {
    // Convert asset patterns to a list of asset strings that match them.
    // Assets strings are formatted as `asset_<hash>.<type>` and represent
    // the name that the file will have in the app bundle. The `asset_` prefix is
    // needed because android doesn't support assets that start with numbers.
    const fullPatterns = assetPatternsToBeBundled1.map((p)=>_path.default.join(projectRoot, p)
    );
    logPatterns(fullPatterns);
    const allBundledAssets = assets.map((asset)=>{
        const shouldBundle = shouldBundleAsset(asset, fullPatterns);
        if (shouldBundle) {
            var ref;
            debug(`${shouldBundle ? "Include" : "Exclude"} asset ${(ref = asset.files) == null ? void 0 : ref[0]}`);
            return asset.fileHashes.map((hash)=>mapAssetHashToAssetString(asset, hash)
            );
        }
        return [];
    }).flat();
    // The assets returned by the RN packager has duplicates so make sure we
    // only bundle each once.
    return new Set(allBundledAssets);
}
function resolveAssetPatternsToBeBundled(projectRoot, exp, assets) {
    if (!assetPatternsToBeBundled(exp)) {
        return undefined;
    }
    var ref;
    const bundledAssets = setOfAssetsToBeBundled(assets, (ref = assetPatternsToBeBundled(exp)) != null ? ref : [
        "**/*"
    ], projectRoot);
    return bundledAssets;
}
function logPatterns(patterns) {
    // Only log the patterns in debug mode, if they aren't already defined in the app.json, then all files will be targeted.
    Log.log("\nProcessing asset bundle patterns:");
    patterns.forEach((p)=>Log.log("- " + p)
    );
}
function shouldBundleAsset(asset, patterns) {
    var ref;
    const file = (ref = asset.files) == null ? void 0 : ref[0];
    return !!("__packager_asset" in asset && asset.__packager_asset && file && patterns.some((pattern)=>(0, _minimatch).default(file, pattern)
    ));
}
async function exportAssetsAsync(projectRoot, { exp , outputDir , bundles: { web , ...bundles } , baseUrl , files =new Map()  }) {
    var ref;
    // NOTE: We use a different system for static web
    if (web) {
        // Save assets like a typical bundler, preserving the file paths on web.
        // TODO: Update React Native Web to support loading files from asset hashes.
        await (0, _persistMetroAssets).persistMetroAssetsAsync(web.assets, {
            files,
            platform: "web",
            outputDirectory: outputDir,
            baseUrl
        });
    }
    const assets = (0, _array).uniqBy(Object.values(bundles).flatMap((bundle)=>bundle.assets
    ), (asset)=>asset.hash
    );
    let bundledAssetsSet = undefined;
    let filteredAssets = assets;
    const embeddedHashSet = new Set();
    if ((ref = assets[0]) == null ? void 0 : ref.fileHashes) {
        debug(`Assets = ${JSON.stringify(assets, null, 2)}`);
        // Updates the manifest to reflect additional asset bundling + configs
        // Get only asset strings for assets we will save
        bundledAssetsSet = resolveAssetPatternsToBeBundled(projectRoot, exp, assets);
        if (bundledAssetsSet) {
            debug(`Bundled assets = ${JSON.stringify([
                ...bundledAssetsSet
            ], null, 2)}`);
            // Filter asset objects to only ones that include assetPatternsToBeBundled matches
            filteredAssets = assets.filter((asset)=>{
                const shouldInclude = assetShouldBeIncludedInExport(asset, bundledAssetsSet);
                if (!shouldInclude) {
                    embeddedHashSet.add(asset.hash);
                }
                return shouldInclude;
            });
            debug(`Filtered assets count = ${filteredAssets.length}`);
        }
        const hashes = new Set();
        // Add assets to copy.
        filteredAssets.forEach((asset)=>{
            const assetId = "fileSystemLocation" in asset ? _path.default.relative(projectRoot, _path.default.join(asset.fileSystemLocation, asset.name)) + (asset.type ? "." + asset.type : "") : undefined;
            asset.files.forEach((fp, index)=>{
                const hash = asset.fileHashes[index];
                if (hashes.has(hash)) return;
                hashes.add(hash);
                files.set(_path.default.join("assets", hash), {
                    originFilename: _path.default.relative(projectRoot, fp),
                    contents: _fs.default.readFileSync(fp),
                    assetId
                });
            });
        });
    }
    // Add google services file if it exists
    await (0, _resolveAssets).resolveGoogleServicesFile(projectRoot, exp);
    return {
        exp,
        assets,
        embeddedHashSet,
        files
    };
}

//# sourceMappingURL=exportAssets.js.map