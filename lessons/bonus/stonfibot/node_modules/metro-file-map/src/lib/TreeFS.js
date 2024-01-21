"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = void 0;
var _constants = _interopRequireDefault(require("../constants"));
var fastPath = _interopRequireWildcard(require("../lib/fast_path"));
var _invariant = _interopRequireDefault(require("invariant"));
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
 * @format
 *
 */

// Terminology:
//
// mixedPath - a root-relative or absolute path
// relativePath - a root-relative path
// normalPath - a root-relative, normalised path (no extraneous '.' or '..')
// canonicalPath - a root-relative, normalised, real path (no symlinks in dirname)

class TreeFS {
  #cachedNormalSymlinkTargets = new WeakMap();
  #rootDir;
  #rootNode = new Map();
  constructor({ rootDir, files }) {
    this.#rootDir = rootDir;
    if (files != null) {
      this.bulkAddOrModify(files);
    }
  }
  getSerializableSnapshot() {
    return this._cloneTree(this.#rootNode);
  }
  static fromDeserializedSnapshot({ rootDir, fileSystemData }) {
    const tfs = new TreeFS({
      rootDir,
    });
    tfs.#rootNode = fileSystemData;
    return tfs;
  }
  getModuleName(mixedPath) {
    const fileMetadata = this._getFileData(mixedPath);
    return (fileMetadata && fileMetadata[_constants.default.ID]) ?? null;
  }
  getSize(mixedPath) {
    const fileMetadata = this._getFileData(mixedPath);
    return (fileMetadata && fileMetadata[_constants.default.SIZE]) ?? null;
  }
  getDependencies(mixedPath) {
    const fileMetadata = this._getFileData(mixedPath);
    if (fileMetadata) {
      return fileMetadata[_constants.default.DEPENDENCIES]
        ? fileMetadata[_constants.default.DEPENDENCIES].split(
            _constants.default.DEPENDENCY_DELIM
          )
        : [];
    } else {
      return null;
    }
  }
  getDifference(files) {
    const changedFiles = new Map(files);
    const removedFiles = new Set();
    for (const { canonicalPath, metadata } of this.metadataIterator({
      includeSymlinks: true,
      includeNodeModules: true,
    })) {
      const newMetadata = files.get(canonicalPath);
      if (newMetadata) {
        if (
          (newMetadata[_constants.default.SYMLINK] === 0) !==
          (metadata[_constants.default.SYMLINK] === 0)
        ) {
          // Types differ, file has changed
          continue;
        }
        if (
          newMetadata[_constants.default.MTIME] != null &&
          // TODO: Remove when mtime is null if not populated
          newMetadata[_constants.default.MTIME] != 0 &&
          newMetadata[_constants.default.MTIME] ===
            metadata[_constants.default.MTIME]
        ) {
          // Types and modified time match - not changed.
          changedFiles.delete(canonicalPath);
        } else if (
          newMetadata[_constants.default.SHA1] != null &&
          newMetadata[_constants.default.SHA1] ===
            metadata[_constants.default.SHA1] &&
          metadata[_constants.default.VISITED] === 1
        ) {
          // Content matches - update modified time but don't revisit
          const updatedMetadata = [...metadata];
          updatedMetadata[_constants.default.MTIME] =
            newMetadata[_constants.default.MTIME];
          changedFiles.set(canonicalPath, updatedMetadata);
        }
      } else {
        removedFiles.add(canonicalPath);
      }
    }
    return {
      changedFiles,
      removedFiles,
    };
  }
  getSha1(mixedPath) {
    const fileMetadata = this._getFileData(mixedPath);
    return (fileMetadata && fileMetadata[_constants.default.SHA1]) ?? null;
  }
  exists(mixedPath) {
    const result = this._getFileData(mixedPath);
    return result != null;
  }
  getAllFiles() {
    const rootDir = this.#rootDir;
    return Array.from(
      this.metadataIterator({
        includeSymlinks: false,
        includeNodeModules: true,
      }),
      ({ canonicalPath }) => fastPath.resolve(rootDir, canonicalPath)
    );
  }
  linkStats(mixedPath) {
    const fileMetadata = this._getFileData(mixedPath, {
      followLeaf: false,
    });
    if (fileMetadata == null) {
      return null;
    }
    const fileType = fileMetadata[_constants.default.SYMLINK] === 0 ? "f" : "l";
    const modifiedTime = fileMetadata[_constants.default.MTIME];
    return {
      fileType,
      modifiedTime,
    };
  }

  /**
   * Given a search context, return a list of file paths matching the query.
   * The query matches against normalized paths which start with `./`,
   * for example: `a/b.js` -> `./a/b.js`
   */
  *matchFiles({
    filter = null,
    filterCompareAbsolute = false,
    filterComparePosix = false,
    follow = false,
    recursive = true,
    rootDir = null,
  }) {
    const normalRoot = rootDir == null ? "" : this._normalizePath(rootDir);
    const contextRootResult = this._lookupByNormalPath(normalRoot);
    if (!contextRootResult) {
      return;
    }
    const { canonicalPath: rootRealPath, node: contextRoot } =
      contextRootResult;
    if (!(contextRoot instanceof Map)) {
      return;
    }
    const contextRootAbsolutePath =
      rootRealPath === ""
        ? this.#rootDir
        : _path.default.join(this.#rootDir, rootRealPath);
    const prefix = filterComparePosix ? "./" : "." + _path.default.sep;
    const contextRootAbsolutePathForComparison =
      filterComparePosix && _path.default.sep !== "/"
        ? contextRootAbsolutePath.replaceAll(_path.default.sep, "/")
        : contextRootAbsolutePath;
    for (const relativePathForComparison of this._pathIterator(contextRoot, {
      alwaysYieldPosix: filterComparePosix,
      canonicalPathOfRoot: rootRealPath,
      follow,
      recursive,
      subtreeOnly: rootDir != null,
    })) {
      if (
        filter == null ||
        filter.test(
          // NOTE(EvanBacon): Ensure files start with `./` for matching purposes
          // this ensures packages work across Metro and Webpack (ex: Storybook for React DOM / React Native).
          // `a/b.js` -> `./a/b.js`
          filterCompareAbsolute === true
            ? _path.default.join(
                contextRootAbsolutePathForComparison,
                relativePathForComparison
              )
            : prefix + relativePathForComparison
        )
      ) {
        const relativePath =
          filterComparePosix === true && _path.default.sep !== "/"
            ? relativePathForComparison.replaceAll("/", _path.default.sep)
            : relativePathForComparison;
        yield _path.default.join(contextRootAbsolutePath, relativePath);
      }
    }
  }
  getRealPath(mixedPath) {
    const normalPath = this._normalizePath(mixedPath);
    const result = this._lookupByNormalPath(normalPath, {
      followLeaf: true,
    });
    if (!result || result.node instanceof Map) {
      return null;
    }
    return fastPath.resolve(this.#rootDir, result.canonicalPath);
  }
  addOrModify(mixedPath, metadata) {
    const normalPath = this._normalizePath(mixedPath);
    // Walk the tree to find the *real* path of the parent node, creating
    // directories as we need.
    const parentDirNode = this._lookupByNormalPath(
      _path.default.dirname(normalPath),
      {
        makeDirectories: true,
      }
    );
    if (!parentDirNode) {
      throw new Error(
        `TreeFS: Failed to make parent directory entry for ${mixedPath}`
      );
    }
    // Normalize the resulting path to account for the parent node being root.
    const canonicalPath = this._normalizePath(
      parentDirNode.canonicalPath +
        _path.default.sep +
        _path.default.basename(normalPath)
    );
    this.bulkAddOrModify(new Map([[canonicalPath, metadata]]));
  }
  bulkAddOrModify(addedOrModifiedFiles) {
    // Optimisation: Bulk FileData are typically clustered by directory, so we
    // optimise for that case by remembering the last directory we looked up.
    // Experiments with large result sets show this to be significantly (~30%)
    // faster than caching all lookups in a Map, and 70% faster than no cache.
    let lastDir;
    let directoryNode;
    for (const [normalPath, metadata] of addedOrModifiedFiles) {
      const lastSepIdx = normalPath.lastIndexOf(_path.default.sep);
      const dirname = lastSepIdx === -1 ? "" : normalPath.slice(0, lastSepIdx);
      const basename =
        lastSepIdx === -1 ? normalPath : normalPath.slice(lastSepIdx + 1);
      if (directoryNode == null || dirname !== lastDir) {
        const lookup = this._lookupByNormalPath(dirname, {
          followLeaf: false,
          makeDirectories: true,
        });
        if (!(lookup?.node instanceof Map)) {
          throw new Error(
            `TreeFS: Could not add directory ${dirname} when adding files`
          );
        }
        lastDir = dirname;
        directoryNode = lookup.node;
      }
      directoryNode.set(basename, metadata);
    }
  }
  remove(mixedPath) {
    const normalPath = this._normalizePath(mixedPath);
    const result = this._lookupByNormalPath(normalPath, {
      followLeaf: false,
    });
    if (!result) {
      return null;
    }
    const { parentNode, canonicalPath, node } = result;
    if (node instanceof Map) {
      throw new Error(`TreeFS: remove called on a directory: ${mixedPath}`);
    }
    // If node is a symlink, get its metadata from the tuple.
    const fileMetadata = node;
    if (fileMetadata == null) {
      throw new Error(`TreeFS: Missing metadata for ${mixedPath}`);
    }
    if (parentNode == null) {
      throw new Error(`TreeFS: Missing parent node for ${mixedPath}`);
    }
    parentNode.delete(_path.default.basename(canonicalPath));
    return fileMetadata;
  }
  _lookupByNormalPath(
    requestedNormalPath,
    opts = {
      followLeaf: true,
      makeDirectories: false,
    }
  ) {
    // We'll update the target if we hit a symlink.
    let targetNormalPath = requestedNormalPath;
    // Lazy-initialised set of seen target paths, to detect symlink cycles.
    let seen;
    // Pointer to the first character of the current path segment in
    // targetNormalPath.
    let fromIdx = 0;
    // The parent of the current segment
    let parentNode = this.#rootNode;
    while (targetNormalPath.length > fromIdx) {
      const nextSepIdx = targetNormalPath.indexOf(_path.default.sep, fromIdx);
      const isLastSegment = nextSepIdx === -1;
      const segmentName = isLastSegment
        ? targetNormalPath.slice(fromIdx)
        : targetNormalPath.slice(fromIdx, nextSepIdx);
      fromIdx = !isLastSegment ? nextSepIdx + 1 : targetNormalPath.length;
      if (segmentName === ".") {
        continue;
      }
      let segmentNode = parentNode.get(segmentName);
      if (segmentNode == null) {
        if (opts.makeDirectories !== true) {
          return null;
        }
        segmentNode = new Map();
        parentNode.set(segmentName, segmentNode);
      }

      // If there are no more '/' to come, we're done unless this is a symlink
      // we must follow.
      if (
        isLastSegment &&
        (segmentNode instanceof Map ||
          segmentNode[_constants.default.SYMLINK] === 0 ||
          opts.followLeaf === false)
      ) {
        return {
          canonicalPath: targetNormalPath,
          node: segmentNode,
          parentNode,
        };
      }

      // If the next node is a directory, go into it
      if (segmentNode instanceof Map) {
        parentNode = segmentNode;
      } else {
        if (segmentNode[_constants.default.SYMLINK] === 0) {
          // Regular file in a directory path
          return null;
        }

        // Symlink in a directory path
        const normalSymlinkTarget = this._resolveSymlinkTargetToNormalPath(
          segmentNode,
          isLastSegment
            ? targetNormalPath
            : targetNormalPath.slice(0, fromIdx - 1)
        );

        // Append any subsequent path segments to the symlink target, and reset
        // with our new target.
        targetNormalPath = isLastSegment
          ? normalSymlinkTarget
          : normalSymlinkTarget +
            _path.default.sep +
            targetNormalPath.slice(fromIdx);
        if (seen == null) {
          // Optimisation: set this lazily only when we've encountered a symlink
          seen = new Set([requestedNormalPath]);
        }
        if (seen.has(targetNormalPath)) {
          // TODO: Warn `Symlink cycle detected: ${[...seen, node].join(' -> ')}`
          return null;
        }
        seen.add(targetNormalPath);
        fromIdx = 0;
        parentNode = this.#rootNode;
      }
    }
    (0, _invariant.default)(
      parentNode === this.#rootNode,
      "Unexpectedly escaped traversal"
    );
    return {
      canonicalPath: targetNormalPath,
      node: this.#rootNode,
      parentNode: null,
    };
  }
  *metadataIterator(opts) {
    yield* this._metadataIterator(this.#rootNode, opts);
  }
  *_metadataIterator(rootNode, opts, prefix = "") {
    for (const [name, node] of rootNode) {
      if (
        !opts.includeNodeModules &&
        node instanceof Map &&
        name === "node_modules"
      ) {
        continue;
      }
      const prefixedName =
        prefix === "" ? name : prefix + _path.default.sep + name;
      if (node instanceof Map) {
        yield* this._metadataIterator(node, opts, prefixedName);
      } else if (
        node[_constants.default.SYMLINK] === 0 ||
        opts.includeSymlinks
      ) {
        yield {
          canonicalPath: prefixedName,
          metadata: node,
          baseName: name,
        };
      }
    }
  }
  _normalizePath(relativeOrAbsolutePath) {
    return _path.default.isAbsolute(relativeOrAbsolutePath)
      ? fastPath.relative(this.#rootDir, relativeOrAbsolutePath)
      : _path.default.normalize(relativeOrAbsolutePath);
  }

  /**
   * Enumerate paths under a given node, including symlinks and through
   * symlinks (if `follow` is enabled).
   */
  *_pathIterator(rootNode, opts, pathPrefix = "", followedLinks = new Set()) {
    const pathSep = opts.alwaysYieldPosix ? "/" : _path.default.sep;
    const prefixWithSep = pathPrefix === "" ? pathPrefix : pathPrefix + pathSep;
    for (const [name, node] of rootNode ?? this.#rootNode) {
      if (opts.subtreeOnly && name === "..") {
        continue;
      }
      const nodePath = prefixWithSep + name;
      if (!(node instanceof Map)) {
        if (node[_constants.default.SYMLINK] === 0) {
          // regular file
          yield nodePath;
        } else {
          // symlink
          const nodePathWithSystemSeparators =
            pathSep === _path.default.sep
              ? nodePath
              : nodePath.replaceAll(pathSep, _path.default.sep);

          // Although both paths are normal, the node path may begin '..' so we
          // can't simply concatenate.
          const normalPathOfSymlink = _path.default.join(
            opts.canonicalPathOfRoot,
            nodePathWithSystemSeparators
          );

          // We can't resolve the symlink directly here because we only have
          // its normal path, and we need a canonical path for resolution
          // (imagine our normal path contains a symlink 'bar' -> '.', and we
          // are at /foo/bar/baz where baz -> '..' - that should resolve to
          // /foo, not /foo/bar). We *can* use _lookupByNormalPath to walk to
          // the canonical symlink, and then to its target.
          const resolved = this._lookupByNormalPath(normalPathOfSymlink, {
            followLeaf: true,
          });
          if (resolved == null) {
            // Symlink goes nowhere, nothing to report.
            continue;
          }
          const target = resolved.node;
          if (!(target instanceof Map)) {
            // Symlink points to a file, just yield the path of the symlink.
            yield nodePath;
          } else if (
            opts.recursive &&
            opts.follow &&
            !followedLinks.has(node)
          ) {
            // Symlink points to a directory - iterate over its contents using
            // the path where we found the symlink as a prefix.
            yield* this._pathIterator(
              target,
              opts,
              nodePath,
              new Set([...followedLinks, node])
            );
          }
        }
      } else if (opts.recursive) {
        yield* this._pathIterator(node, opts, nodePath, followedLinks);
      }
    }
  }
  _resolveSymlinkTargetToNormalPath(symlinkNode, canonicalPathOfSymlink) {
    let normalSymlinkTarget = this.#cachedNormalSymlinkTargets.get(symlinkNode);
    if (normalSymlinkTarget != null) {
      return normalSymlinkTarget;
    }
    const literalSymlinkTarget = symlinkNode[_constants.default.SYMLINK];
    (0, _invariant.default)(
      typeof literalSymlinkTarget === "string",
      "Expected symlink target to be populated."
    );
    const absoluteSymlinkTarget = _path.default.resolve(
      this.#rootDir,
      canonicalPathOfSymlink,
      "..",
      // Symlink target is relative to its containing directory.
      literalSymlinkTarget // May be absolute, in which case the above are ignored
    );

    normalSymlinkTarget = _path.default.relative(
      this.#rootDir,
      absoluteSymlinkTarget
    );
    this.#cachedNormalSymlinkTargets.set(symlinkNode, normalSymlinkTarget);
    return normalSymlinkTarget;
  }
  _getFileData(
    filePath,
    opts = {
      followLeaf: true,
    }
  ) {
    const normalPath = this._normalizePath(filePath);
    const result = this._lookupByNormalPath(normalPath, {
      followLeaf: opts.followLeaf,
    });
    if (result == null || result.node instanceof Map) {
      return null;
    }
    return result.node;
  }
  _cloneTree(root) {
    const clone = new Map();
    for (const [name, node] of root) {
      if (node instanceof Map) {
        clone.set(name, this._cloneTree(node));
      } else {
        clone.set(name, [...node]);
      }
    }
    return clone;
  }
}
exports.default = TreeFS;
