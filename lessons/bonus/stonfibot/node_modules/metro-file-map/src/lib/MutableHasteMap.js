"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = void 0;
var _constants = _interopRequireDefault(require("../constants"));
var _DuplicateError = require("./DuplicateError");
var _DuplicateHasteCandidatesError = require("./DuplicateHasteCandidatesError");
var fastPath = _interopRequireWildcard(require("./fast_path"));
var _getPlatformExtension = _interopRequireDefault(
  require("./getPlatformExtension")
);
var _path = _interopRequireDefault(require("path"));
function _getRequireWildcardCache(nodeInterop) {
  if (typeof WeakMap !== "function") return null;
  var cacheBabelInterop = new WeakMap();
  var cacheNodeInterop = new WeakMap();
  return (_getRequireWildcardCache = function (nodeInterop) {
    return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
  })(nodeInterop);
}
function _interopRequireWildcard(obj, nodeInterop) {
  if (!nodeInterop && obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== "object" && typeof obj !== "function")) {
    return { default: obj };
  }
  var cache = _getRequireWildcardCache(nodeInterop);
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 * @oncall react_native
 */

const EMPTY_OBJ = {};
const EMPTY_MAP = new Map();
class MutableHasteMap {
  #rootDir;
  #map = new Map();
  #duplicates = new Map();
  #console;
  #throwOnModuleCollision;
  #platforms;
  constructor(options) {
    this.#console = options.console ?? null;
    this.#platforms = options.platforms;
    this.#rootDir = options.rootDir;
    this.#throwOnModuleCollision = options.throwOnModuleCollision;
  }
  static fromDeserializedSnapshot(deserializedData, options) {
    const hasteMap = new MutableHasteMap(options);
    hasteMap.#map = deserializedData.map;
    hasteMap.#duplicates = deserializedData.duplicates;
    return hasteMap;
  }
  getSerializableSnapshot() {
    const mapMap = (map, mapFn) => {
      return new Map(
        Array.from(map.entries(), ([key, val]) => [key, mapFn(val)])
      );
    };
    return {
      duplicates: mapMap(this.#duplicates, (v) =>
        mapMap(v, (v2) => new Map(v2.entries()))
      ),
      map: mapMap(this.#map, (v) =>
        Object.assign(
          Object.create(null),
          Object.fromEntries(
            Array.from(Object.entries(v), ([key, val]) => [key, [...val]])
          )
        )
      ),
    };
  }
  getModule(name, platform, supportsNativePlatform, type) {
    const module = this._getModuleMetadata(
      name,
      platform,
      !!supportsNativePlatform
    );
    if (
      module &&
      module[_constants.default.TYPE] === (type ?? _constants.default.MODULE)
    ) {
      const modulePath = module[_constants.default.PATH];
      return modulePath && fastPath.resolve(this.#rootDir, modulePath);
    }
    return null;
  }
  getPackage(name, platform, _supportsNativePlatform) {
    return this.getModule(name, platform, null, _constants.default.PACKAGE);
  }

  // FIXME: This is only used by Meta-internal validation and should be
  // removed or replaced with a less leaky API.
  getRawHasteMap() {
    return {
      duplicates: this.#duplicates,
      map: this.#map,
    };
  }

  /**
   * When looking up a module's data, we walk through each eligible platform for
   * the query. For each platform, we want to check if there are known
   * duplicates for that name+platform pair. The duplication logic normally
   * removes elements from the `map` object, but we want to check upfront to be
   * extra sure. If metadata exists both in the `duplicates` object and the
   * `map`, this would be a bug.
   */
  _getModuleMetadata(name, platform, supportsNativePlatform) {
    const map = this.#map.get(name) || EMPTY_OBJ;
    const dupMap = this.#duplicates.get(name) || EMPTY_MAP;
    if (platform != null) {
      this._assertNoDuplicates(
        name,
        platform,
        supportsNativePlatform,
        dupMap.get(platform)
      );
      if (map[platform] != null) {
        return map[platform];
      }
    }
    if (supportsNativePlatform) {
      this._assertNoDuplicates(
        name,
        _constants.default.NATIVE_PLATFORM,
        supportsNativePlatform,
        dupMap.get(_constants.default.NATIVE_PLATFORM)
      );
      if (map[_constants.default.NATIVE_PLATFORM]) {
        return map[_constants.default.NATIVE_PLATFORM];
      }
    }
    this._assertNoDuplicates(
      name,
      _constants.default.GENERIC_PLATFORM,
      supportsNativePlatform,
      dupMap.get(_constants.default.GENERIC_PLATFORM)
    );
    if (map[_constants.default.GENERIC_PLATFORM]) {
      return map[_constants.default.GENERIC_PLATFORM];
    }
    return null;
  }
  _assertNoDuplicates(name, platform, supportsNativePlatform, relativePathSet) {
    if (relativePathSet == null) {
      return;
    }
    const duplicates = new Map();
    for (const [relativePath, type] of relativePathSet) {
      const duplicatePath = fastPath.resolve(this.#rootDir, relativePath);
      duplicates.set(duplicatePath, type);
    }
    throw new _DuplicateHasteCandidatesError.DuplicateHasteCandidatesError(
      name,
      platform,
      supportsNativePlatform,
      duplicates
    );
  }
  setModule(id, module) {
    let hasteMapItem = this.#map.get(id);
    if (!hasteMapItem) {
      // $FlowFixMe[unclear-type] - Add type coverage
      hasteMapItem = Object.create(null);
      this.#map.set(id, hasteMapItem);
    }
    const platform =
      (0, _getPlatformExtension.default)(
        module[_constants.default.PATH],
        this.#platforms
      ) || _constants.default.GENERIC_PLATFORM;
    const existingModule = hasteMapItem[platform];
    if (
      existingModule &&
      existingModule[_constants.default.PATH] !==
        module[_constants.default.PATH]
    ) {
      if (this.#console) {
        const method = this.#throwOnModuleCollision ? "error" : "warn";
        this.#console[method](
          [
            "metro-file-map: Haste module naming collision: " + id,
            "  The following files share their name; please adjust your hasteImpl:",
            "    * <rootDir>" +
              _path.default.sep +
              existingModule[_constants.default.PATH],
            "    * <rootDir>" +
              _path.default.sep +
              module[_constants.default.PATH],
            "",
          ].join("\n")
        );
      }
      if (this.#throwOnModuleCollision) {
        throw new _DuplicateError.DuplicateError(
          existingModule[_constants.default.PATH],
          module[_constants.default.PATH]
        );
      }

      // We do NOT want consumers to use a module that is ambiguous.
      delete hasteMapItem[platform];
      if (Object.keys(hasteMapItem).length === 0) {
        this.#map.delete(id);
      }
      let dupsByPlatform = this.#duplicates.get(id);
      if (dupsByPlatform == null) {
        dupsByPlatform = new Map();
        this.#duplicates.set(id, dupsByPlatform);
      }
      const dups = new Map([
        [module[_constants.default.PATH], module[_constants.default.TYPE]],
        [
          existingModule[_constants.default.PATH],
          existingModule[_constants.default.TYPE],
        ],
      ]);
      dupsByPlatform.set(platform, dups);
      return;
    }
    const dupsByPlatform = this.#duplicates.get(id);
    if (dupsByPlatform != null) {
      const dups = dupsByPlatform.get(platform);
      if (dups != null) {
        dups.set(
          module[_constants.default.PATH],
          module[_constants.default.TYPE]
        );
      }
      return;
    }
    hasteMapItem[platform] = module;
  }
  removeModule(moduleName, relativeFilePath) {
    const platform =
      (0, _getPlatformExtension.default)(relativeFilePath, this.#platforms) ||
      _constants.default.GENERIC_PLATFORM;
    const hasteMapItem = this.#map.get(moduleName);
    if (hasteMapItem != null) {
      delete hasteMapItem[platform];
      if (Object.keys(hasteMapItem).length === 0) {
        this.#map.delete(moduleName);
      } else {
        this.#map.set(moduleName, hasteMapItem);
      }
    }
    this._recoverDuplicates(moduleName, relativeFilePath);
  }
  setThrowOnModuleCollision(shouldThrow) {
    this.#throwOnModuleCollision = shouldThrow;
  }

  /**
   * This function should be called when the file under `filePath` is removed
   * or changed. When that happens, we want to figure out if that file was
   * part of a group of files that had the same ID. If it was, we want to
   * remove it from the group. Furthermore, if there is only one file
   * remaining in the group, then we want to restore that single file as the
   * correct resolution for its ID, and cleanup the duplicates index.
   */
  _recoverDuplicates(moduleName, relativeFilePath) {
    let dupsByPlatform = this.#duplicates.get(moduleName);
    if (dupsByPlatform == null) {
      return;
    }
    const platform =
      (0, _getPlatformExtension.default)(relativeFilePath, this.#platforms) ||
      _constants.default.GENERIC_PLATFORM;
    let dups = dupsByPlatform.get(platform);
    if (dups == null) {
      return;
    }
    dupsByPlatform = new Map(dupsByPlatform);
    this.#duplicates.set(moduleName, dupsByPlatform);
    dups = new Map(dups);
    dupsByPlatform.set(platform, dups);
    dups.delete(relativeFilePath);
    if (dups.size !== 1) {
      return;
    }
    const uniqueModule = dups.entries().next().value;
    if (!uniqueModule) {
      return;
    }
    let dedupMap = this.#map.get(moduleName);
    if (dedupMap == null) {
      dedupMap = Object.create(null);
      this.#map.set(moduleName, dedupMap);
    }
    dedupMap[platform] = uniqueModule;
    dupsByPlatform.delete(platform);
    if (dupsByPlatform.size === 0) {
      this.#duplicates.delete(moduleName);
    }
  }
}
exports.default = MutableHasteMap;
