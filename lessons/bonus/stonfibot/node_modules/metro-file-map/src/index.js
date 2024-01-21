"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
Object.defineProperty(exports, "DiskCacheManager", {
  enumerable: true,
  get: function () {
    return _DiskCacheManager.DiskCacheManager;
  },
});
Object.defineProperty(exports, "DuplicateHasteCandidatesError", {
  enumerable: true,
  get: function () {
    return _DuplicateHasteCandidatesError.DuplicateHasteCandidatesError;
  },
});
Object.defineProperty(exports, "MutableHasteMap", {
  enumerable: true,
  get: function () {
    return _MutableHasteMap.default;
  },
});
exports.default = void 0;
var _DiskCacheManager = require("./cache/DiskCacheManager");
var _constants = _interopRequireDefault(require("./constants"));
var _getMockName = _interopRequireDefault(require("./getMockName"));
var _checkWatchmanCapabilities = _interopRequireDefault(
  require("./lib/checkWatchmanCapabilities")
);
var _DuplicateError = require("./lib/DuplicateError");
var fastPath = _interopRequireWildcard(require("./lib/fast_path"));
var _MockMap = _interopRequireDefault(require("./lib/MockMap"));
var _MutableHasteMap = _interopRequireDefault(require("./lib/MutableHasteMap"));
var _normalizePathSeparatorsToSystem = _interopRequireDefault(
  require("./lib/normalizePathSeparatorsToSystem")
);
var _TreeFS = _interopRequireDefault(require("./lib/TreeFS"));
var _Watcher = require("./Watcher");
var _worker = require("./worker");
var _events = _interopRequireDefault(require("events"));
var _invariant = _interopRequireDefault(require("invariant"));
var _jestWorker = require("jest-worker");
var _nodeAbortController = require("node-abort-controller");
var _nullthrows = _interopRequireDefault(require("nullthrows"));
var path = _interopRequireWildcard(require("path"));
var _perf_hooks = require("perf_hooks");
var _DuplicateHasteCandidatesError = require("./lib/DuplicateHasteCandidatesError");
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

const debug = require("debug")("Metro:FileMap");
// This should be bumped whenever a code change to `metro-file-map` itself
// would cause a change to the cache data structure and/or content (for a given
// filesystem state and build parameters).
const CACHE_BREAKER = "7";
const CHANGE_INTERVAL = 30;
// Periodically yield to the event loop to allow parallel I/O, etc.
// Based on 200k files taking up to 800ms => max 40ms between yields.
const YIELD_EVERY_NUM_HASTE_FILES = 10000;
const NODE_MODULES = path.sep + "node_modules" + path.sep;
const PACKAGE_JSON = path.sep + "package.json";
const VCS_DIRECTORIES = /[/\\]\.(git|hg)[/\\]/.source;
const WATCHMAN_REQUIRED_CAPABILITIES = [
  "field-content.sha1hex",
  "relative_root",
  "suffix-set",
  "wildmatch",
];

/**
 * FileMap includes a JavaScript implementation of Facebook's haste module system.
 *
 * This implementation is inspired by https://github.com/facebook/node-haste
 * and was built with for high-performance in large code repositories with
 * hundreds of thousands of files. This implementation is scalable and provides
 * predictable performance.
 *
 * Because the haste map creation and synchronization is critical to startup
 * performance and most tasks are blocked by I/O this class makes heavy use of
 * synchronous operations. It uses worker processes for parallelizing file
 * access and metadata extraction.
 *
 * The data structures created by `metro-file-map` can be used directly from the
 * cache without further processing. The metadata objects in the `files` and
 * `map` objects contain cross-references: a metadata object from one can look
 * up the corresponding metadata object in the other map. Note that in most
 * projects, the number of files will be greater than the number of haste
 * modules one module can refer to many files based on platform extensions.
 *
 * type CacheData = {
 *   clocks: WatchmanClocks,
 *   files: {[filepath: string]: FileMetaData},
 *   map: {[id: string]: HasteMapItem},
 *   mocks: {[id: string]: string},
 * }
 *
 * // Watchman clocks are used for query synchronization and file system deltas.
 * type WatchmanClocks = {[filepath: string]: string};
 *
 * type FileMetaData = {
 *   id: ?string, // used to look up module metadata objects in `map`.
 *   mtime: number, // check for outdated files.
 *   size: number, // size of the file in bytes.
 *   visited: boolean, // whether the file has been parsed or not.
 *   dependencies: Array<string>, // all relative dependencies of this file.
 *   sha1: ?string, // SHA-1 of the file, if requested via options.
 *   symlink: ?(1 | 0 | string), // Truthy if symlink, string is target
 * };
 *
 * // Modules can be targeted to a specific platform based on the file name.
 * // Example: platform.ios.js and Platform.android.js will both map to the same
 * // `Platform` module. The platform should be specified during resolution.
 * type HasteMapItem = {[platform: string]: ModuleMetaData};
 *
 * //
 * type ModuleMetaData = {
 *   path: string, // the path to look up the file object in `files`.
 *   type: string, // the module type (either `package` or `module`).
 * };
 *
 * Note that the data structures described above are conceptual only. The actual
 * implementation uses arrays and constant keys for metadata storage. Instead of
 * `{id: 'flatMap', mtime: 3421, size: 42, visited: true, dependencies: []}` the real
 * representation is similar to `['flatMap', 3421, 42, 1, []]` to save storage space
 * and reduce parse and write time of a big JSON blob.
 *
 * The HasteMap is created as follows:
 *  1. read data from the cache or create an empty structure.
 *
 *  2. crawl the file system.
 *     * empty cache: crawl the entire file system.
 *     * cache available:
 *       * if watchman is available: get file system delta changes.
 *       * if watchman is unavailable: crawl the entire file system.
 *     * build metadata objects for every file. This builds the `files` part of
 *       the `HasteMap`.
 *
 *  3. parse and extract metadata from changed files.
 *     * this is done in parallel over worker processes to improve performance.
 *     * the worst case is to parse all files.
 *     * the best case is no file system access and retrieving all data from
 *       the cache.
 *     * the average case is a small number of changed files.
 *
 *  4. serialize the new `HasteMap` in a cache file.
 *
 */
class FileMap extends _events.default {
  static create(options) {
    return new FileMap(options);
  }
  constructor(options) {
    super();
    if (options.perfLoggerFactory) {
      this._startupPerfLogger =
        options.perfLoggerFactory?.("START_UP").subSpan("fileMap") ?? null;
      this._startupPerfLogger?.point("constructor_start");
    }

    // Add VCS_DIRECTORIES to provided ignorePattern
    let ignorePattern;
    if (options.ignorePattern) {
      const inputIgnorePattern = options.ignorePattern;
      if (inputIgnorePattern instanceof RegExp) {
        ignorePattern = new RegExp(
          inputIgnorePattern.source.concat("|" + VCS_DIRECTORIES),
          inputIgnorePattern.flags
        );
      } else {
        throw new Error(
          "metro-file-map: the `ignorePattern` option must be a RegExp"
        );
      }
    } else {
      ignorePattern = new RegExp(VCS_DIRECTORIES);
    }
    const buildParameters = {
      computeDependencies:
        options.computeDependencies == null
          ? true
          : options.computeDependencies,
      computeSha1: options.computeSha1 || false,
      dependencyExtractor: options.dependencyExtractor ?? null,
      enableHastePackages: options.enableHastePackages ?? true,
      enableSymlinks: options.enableSymlinks || false,
      extensions: options.extensions,
      forceNodeFilesystemAPI: !!options.forceNodeFilesystemAPI,
      hasteImplModulePath: options.hasteImplModulePath,
      ignorePattern,
      mocksPattern:
        options.mocksPattern != null && options.mocksPattern !== ""
          ? new RegExp(options.mocksPattern)
          : null,
      platforms: options.platforms,
      retainAllFiles: options.retainAllFiles,
      rootDir: options.rootDir,
      roots: Array.from(new Set(options.roots)),
      skipPackageJson: !!options.skipPackageJson,
      cacheBreaker: CACHE_BREAKER,
    };
    this._options = {
      ...buildParameters,
      enableWorkerThreads: options.enableWorkerThreads ?? false,
      healthCheck: options.healthCheck,
      maxWorkers: options.maxWorkers,
      perfLoggerFactory: options.perfLoggerFactory,
      resetCache: options.resetCache,
      throwOnModuleCollision: !!options.throwOnModuleCollision,
      useWatchman: options.useWatchman == null ? true : options.useWatchman,
      watch: !!options.watch,
      watchmanDeferStates: options.watchmanDeferStates ?? [],
    };
    this._console = options.console || global.console;
    this._cacheManager = options.cacheManagerFactory
      ? options.cacheManagerFactory.call(null, buildParameters)
      : new _DiskCacheManager.DiskCacheManager({
          buildParameters,
        });
    this._buildPromise = null;
    this._worker = null;
    this._startupPerfLogger?.point("constructor_end");
    this._crawlerAbortController = new _nodeAbortController.AbortController();
    this._changeID = 0;
  }
  build() {
    this._startupPerfLogger?.point("build_start");
    if (!this._buildPromise) {
      this._buildPromise = (async () => {
        let initialData;
        if (this._options.resetCache !== true) {
          initialData = await this.read();
        }
        if (!initialData) {
          debug("Not using a cache");
        } else {
          debug("Cache loaded (%d clock(s))", initialData.clocks.size);
        }
        const rootDir = this._options.rootDir;
        this._startupPerfLogger?.point("constructFileSystem_start");
        const fileSystem =
          initialData != null
            ? _TreeFS.default.fromDeserializedSnapshot({
                rootDir,
                // Typed `mixed` because we've read this from an external
                // source. It'd be too expensive to validate at runtime, so
                // trust our cache manager that this is correct.
                // $FlowIgnore
                fileSystemData: initialData.fileSystemData,
              })
            : new _TreeFS.default({
                rootDir,
              });
        this._startupPerfLogger?.point("constructFileSystem_end");
        const mocks = initialData?.mocks ?? new Map();

        // Construct the Haste map from the cached file system state while
        // crawling to build a diff of current state vs cached. `fileSystem`
        // is not mutated during either operation.
        const [fileDelta, hasteMap] = await Promise.all([
          this._buildFileDelta({
            fileSystem,
            clocks: initialData?.clocks ?? new Map(),
          }),
          this._constructHasteMap(fileSystem),
        ]);

        // Update `fileSystem`, `hasteMap` and `mocks` based on the file delta.
        await this._applyFileDelta(fileSystem, hasteMap, mocks, fileDelta);
        await this._takeSnapshotAndPersist(
          fileSystem,
          fileDelta.clocks ?? new Map(),
          hasteMap,
          mocks,
          fileDelta.changedFiles,
          fileDelta.removedFiles
        );
        debug(
          "Finished mapping files (%d changes, %d removed).",
          fileDelta.changedFiles.size,
          fileDelta.removedFiles.size
        );
        await this._watch(fileSystem, hasteMap, mocks);
        return {
          fileSystem,
          hasteMap,
          mockMap: new _MockMap.default({
            rootDir,
            rawMockMap: mocks,
          }),
        };
      })();
    }
    return this._buildPromise.then((result) => {
      this._startupPerfLogger?.point("build_end");
      return result;
    });
  }
  async _constructHasteMap(fileSystem) {
    this._startupPerfLogger?.point("constructHasteMap_start");
    const hasteMap = new _MutableHasteMap.default({
      console: this._console,
      platforms: new Set(this._options.platforms),
      rootDir: this._options.rootDir,
      throwOnModuleCollision: this._options.throwOnModuleCollision,
    });
    let hasteFiles = 0;
    for (const {
      baseName,
      canonicalPath,
      metadata,
    } of fileSystem.metadataIterator({
      // Symlinks and node_modules are never Haste modules or packages.
      includeNodeModules: false,
      includeSymlinks: false,
    })) {
      if (metadata[_constants.default.ID]) {
        hasteMap.setModule(metadata[_constants.default.ID], [
          canonicalPath,
          baseName === "package.json"
            ? _constants.default.PACKAGE
            : _constants.default.MODULE,
        ]);
        if (++hasteFiles % YIELD_EVERY_NUM_HASTE_FILES === 0) {
          await new Promise(setImmediate);
        }
      }
    }
    this._startupPerfLogger?.annotate({
      int: {
        hasteFiles,
      },
    });
    this._startupPerfLogger?.point("constructHasteMap_end");
    return hasteMap;
  }

  /**
   * 1. read data from the cache or create an empty structure.
   */
  async read() {
    let data;
    this._startupPerfLogger?.point("read_start");
    try {
      data = await this._cacheManager.read();
    } catch (e) {
      this._console.warn(
        "Error while reading cache, falling back to a full crawl:\n",
        e
      );
      this._startupPerfLogger?.annotate({
        string: {
          cacheReadError: e.toString(),
        },
      });
    }
    this._startupPerfLogger?.point("read_end");
    return data;
  }

  /**
   * 2. crawl the file system.
   */
  async _buildFileDelta(previousState) {
    this._startupPerfLogger?.point("buildFileDelta_start");
    const {
      computeSha1,
      enableSymlinks,
      extensions,
      forceNodeFilesystemAPI,
      ignorePattern,
      roots,
      rootDir,
      watch,
      watchmanDeferStates,
    } = this._options;
    this._watcher = new _Watcher.Watcher({
      abortSignal: this._crawlerAbortController.signal,
      computeSha1,
      console: this._console,
      enableSymlinks,
      extensions,
      forceNodeFilesystemAPI,
      healthCheckFilePrefix: this._options.healthCheck.filePrefix,
      ignore: (path) => this._ignore(path),
      ignorePattern,
      perfLogger: this._startupPerfLogger,
      previousState,
      roots,
      rootDir,
      useWatchman: await this._shouldUseWatchman(),
      watch,
      watchmanDeferStates,
    });
    const watcher = this._watcher;
    watcher.on("status", (status) => this.emit("status", status));
    return watcher.crawl().then((result) => {
      this._startupPerfLogger?.point("buildFileDelta_end");
      return result;
    });
  }

  /**
   * 3. parse and extract metadata from changed files.
   */
  _processFile(hasteMap, mockMap, filePath, fileMetadata, workerOptions) {
    const rootDir = this._options.rootDir;
    const relativeFilePath = fastPath.relative(rootDir, filePath);
    const isSymlink = fileMetadata[_constants.default.SYMLINK] !== 0;
    const computeSha1 =
      this._options.computeSha1 &&
      !isSymlink &&
      fileMetadata[_constants.default.SHA1] == null;
    const readLink =
      this._options.enableSymlinks &&
      isSymlink &&
      typeof fileMetadata[_constants.default.SYMLINK] !== "string";

    // Callback called when the response from the worker is successful.
    const workerReply = (metadata) => {
      fileMetadata[_constants.default.VISITED] = 1;
      const metadataId = metadata.id;
      const metadataModule = metadata.module;
      if (metadataId != null && metadataModule) {
        fileMetadata[_constants.default.ID] = metadataId;
        hasteMap.setModule(metadataId, metadataModule);
      }
      fileMetadata[_constants.default.DEPENDENCIES] = metadata.dependencies
        ? metadata.dependencies.join(_constants.default.DEPENDENCY_DELIM)
        : "";
      if (computeSha1) {
        fileMetadata[_constants.default.SHA1] = metadata.sha1;
      }
      if (metadata.symlinkTarget != null) {
        fileMetadata[_constants.default.SYMLINK] = metadata.symlinkTarget;
      }
    };

    // Callback called when the response from the worker is an error.
    const workerError = (error) => {
      if (
        error == null ||
        typeof error !== "object" ||
        error.message == null ||
        error.stack == null
      ) {
        // $FlowFixMe[reassign-const] - Refactor this
        error = new Error(error);
        // $FlowFixMe[incompatible-use] - error is mixed
        error.stack = ""; // Remove stack for stack-less errors.
      }

      throw error;
    };

    // If we retain all files in the virtual HasteFS representation, we avoid
    // reading them if they aren't important (node_modules).
    if (this._options.retainAllFiles && filePath.includes(NODE_MODULES)) {
      if (computeSha1 || readLink) {
        return this._getWorker(workerOptions)
          .worker({
            computeDependencies: false,
            computeSha1,
            dependencyExtractor: null,
            enableHastePackages: false,
            filePath,
            hasteImplModulePath: null,
            readLink,
            rootDir,
          })
          .then(workerReply, workerError);
      }
      return null;
    }

    // Symlink Haste modules, Haste packages or mocks are not supported - read
    // the target if requested and return early.
    if (isSymlink) {
      if (readLink) {
        // If we only need to read a link, it's more efficient to do it in-band
        // (with async file IO) than to have the overhead of worker IO.
        return this._getWorker({
          forceInBand: true,
        })
          .worker({
            computeDependencies: false,
            computeSha1: false,
            dependencyExtractor: null,
            enableHastePackages: false,
            filePath,
            hasteImplModulePath: null,
            readLink,
            rootDir,
          })
          .then(workerReply, workerError);
      }
      return null;
    }
    if (
      this._options.mocksPattern &&
      this._options.mocksPattern.test(filePath)
    ) {
      const mockPath = (0, _getMockName.default)(filePath);
      const existingMockPath = mockMap.get(mockPath);
      if (existingMockPath != null) {
        const secondMockPath = fastPath.relative(rootDir, filePath);
        if (existingMockPath !== secondMockPath) {
          const method = this._options.throwOnModuleCollision
            ? "error"
            : "warn";
          this._console[method](
            [
              "metro-file-map: duplicate manual mock found: " + mockPath,
              "  The following files share their name; please delete one of them:",
              "    * <rootDir>" + path.sep + existingMockPath,
              "    * <rootDir>" + path.sep + secondMockPath,
              "",
            ].join("\n")
          );
          if (this._options.throwOnModuleCollision) {
            throw new _DuplicateError.DuplicateError(
              existingMockPath,
              secondMockPath
            );
          }
        }
      }
      mockMap.set(mockPath, relativeFilePath);
    }
    return this._getWorker(workerOptions)
      .worker({
        computeDependencies: this._options.computeDependencies,
        computeSha1,
        dependencyExtractor: this._options.dependencyExtractor,
        enableHastePackages: this._options.enableHastePackages,
        filePath,
        hasteImplModulePath: this._options.hasteImplModulePath,
        readLink: false,
        rootDir,
      })
      .then(workerReply, workerError);
  }
  async _applyFileDelta(fileSystem, hasteMap, mockMap, delta) {
    this._startupPerfLogger?.point("applyFileDelta_start");
    const { changedFiles, removedFiles } = delta;
    this._startupPerfLogger?.point("applyFileDelta_preprocess_start");
    const promises = [];
    const missingFiles = new Set();

    // Remove files first so that we don't mistake moved mocks or Haste
    // modules as duplicates.
    this._startupPerfLogger?.point("applyFileDelta_remove_start");
    for (const relativeFilePath of removedFiles) {
      this._removeIfExists(fileSystem, hasteMap, mockMap, relativeFilePath);
    }
    this._startupPerfLogger?.point("applyFileDelta_remove_end");
    for (const [relativeFilePath, fileData] of changedFiles) {
      // A crawler may preserve the H.VISITED flag to indicate that the file
      // contents are unchaged and it doesn't need visiting again.
      if (fileData[_constants.default.VISITED] === 1) {
        continue;
      }
      if (
        this._options.skipPackageJson &&
        relativeFilePath.endsWith(PACKAGE_JSON)
      ) {
        continue;
      }

      // SHA-1, if requested, should already be present thanks to the crawler.
      const filePath = fastPath.resolve(
        this._options.rootDir,
        relativeFilePath
      );
      const maybePromise = this._processFile(
        hasteMap,
        mockMap,
        filePath,
        fileData,
        {
          perfLogger: this._startupPerfLogger,
        }
      );
      if (maybePromise) {
        promises.push(
          maybePromise.catch((e) => {
            if (["ENOENT", "EACCESS"].includes(e.code)) {
              missingFiles.add(relativeFilePath);
            } else {
              throw e;
            }
          })
        );
      }
    }
    this._startupPerfLogger?.point("applyFileDelta_preprocess_end");
    debug("Visiting %d added/modified files.", promises.length);
    this._startupPerfLogger?.point("applyFileDelta_process_start");
    try {
      await Promise.all(promises);
    } finally {
      this._cleanup();
    }
    this._startupPerfLogger?.point("applyFileDelta_process_end");
    this._startupPerfLogger?.point("applyFileDelta_add_start");
    for (const relativeFilePath of missingFiles) {
      // It's possible that a file could be deleted between being seen by the
      // crawler and our attempt to process it. For our purposes, this is
      // equivalent to the file being deleted before the crawl, being absent
      // from `changedFiles`, and (if we loaded from cache, and the file
      // existed previously) possibly being reported in `removedFiles`.
      //
      // Treat the file accordingly - don't add it to `FileSystem`, and remove
      // it if it already exists. We're not emitting events at this point in
      // startup, so there's nothing more to do.
      changedFiles.delete(relativeFilePath);
      this._removeIfExists(fileSystem, hasteMap, mockMap, relativeFilePath);
    }
    fileSystem.bulkAddOrModify(changedFiles);
    this._startupPerfLogger?.point("applyFileDelta_add_end");
    this._startupPerfLogger?.point("applyFileDelta_end");
  }
  _cleanup() {
    const worker = this._worker;
    if (worker && typeof worker.end === "function") {
      // $FlowFixMe[unused-promise]
      worker.end();
    }
    this._worker = null;
  }

  /**
   * 4. Serialize a snapshot of our raw data via the configured cache manager
   */
  async _takeSnapshotAndPersist(
    fileSystem,
    clocks,
    hasteMap,
    mockMap,
    changed,
    removed
  ) {
    this._startupPerfLogger?.point("persist_start");
    await this._cacheManager.write(
      {
        fileSystemData: fileSystem.getSerializableSnapshot(),
        clocks: new Map(clocks),
        mocks: new Map(mockMap),
      },
      {
        changed,
        removed,
      }
    );
    this._startupPerfLogger?.point("persist_end");
  }

  /**
   * Creates workers or parses files and extracts metadata in-process.
   */
  _getWorker(options) {
    if (!this._worker) {
      const { forceInBand, perfLogger } = options ?? {};
      if (forceInBand === true || this._options.maxWorkers <= 1) {
        this._worker = {
          worker: _worker.worker,
        };
      } else {
        const workerPath = require.resolve("./worker");
        perfLogger?.point("initWorkers_start");
        this._worker = new _jestWorker.Worker(workerPath, {
          exposedMethods: ["worker"],
          maxRetries: 3,
          numWorkers: this._options.maxWorkers,
          enableWorkerThreads: this._options.enableWorkerThreads,
          forkOptions: {
            // Don't pass Node arguments down to workers. In particular, avoid
            // unnecessarily registering Babel when we're running Metro from
            // source (our worker is plain CommonJS).
            execArgv: [],
          },
        });
        perfLogger?.point("initWorkers_end");
      }
    }
    return (0, _nullthrows.default)(this._worker);
  }
  _removeIfExists(fileSystem, hasteMap, mockMap, relativeFilePath) {
    const fileMetadata = fileSystem.remove(relativeFilePath);
    if (fileMetadata == null) {
      return;
    }
    const moduleName = fileMetadata[_constants.default.ID] || null; // Empty string indicates no module
    if (moduleName == null) {
      return;
    }
    hasteMap.removeModule(moduleName, relativeFilePath);
    if (this._options.mocksPattern) {
      const absoluteFilePath = path.join(
        this._options.rootDir,
        (0, _normalizePathSeparatorsToSystem.default)(relativeFilePath)
      );
      if (
        this._options.mocksPattern &&
        this._options.mocksPattern.test(absoluteFilePath)
      ) {
        const mockName = (0, _getMockName.default)(absoluteFilePath);
        mockMap.delete(mockName);
      }
    }
  }

  /**
   * Watch mode
   */
  async _watch(fileSystem, hasteMap, mockMap) {
    this._startupPerfLogger?.point("watch_start");
    if (!this._options.watch) {
      this._startupPerfLogger?.point("watch_end");
      return;
    }

    // In watch mode, we'll only warn about module collisions and we'll retain
    // all files, even changes to node_modules.
    this._options.throwOnModuleCollision = false;
    this._options.retainAllFiles = true;
    const hasWatchedExtension = (filePath) =>
      this._options.extensions.some((ext) => filePath.endsWith(ext));
    const rootDir = this._options.rootDir;
    let changeQueue = Promise.resolve();
    let nextEmit = null;
    const emitChange = () => {
      if (nextEmit == null || nextEmit.eventsQueue.length === 0) {
        // Nothing to emit
        return;
      }
      const { eventsQueue, firstEventTimestamp, firstEnqueuedTimestamp } =
        nextEmit;
      const hmrPerfLogger = this._options.perfLoggerFactory?.("HMR", {
        key: this._getNextChangeID(),
      });
      if (hmrPerfLogger != null) {
        hmrPerfLogger.start({
          timestamp: firstEventTimestamp,
        });
        hmrPerfLogger.point("waitingForChangeInterval_start", {
          timestamp: firstEnqueuedTimestamp,
        });
        hmrPerfLogger.point("waitingForChangeInterval_end");
        hmrPerfLogger.annotate({
          int: {
            eventsQueueLength: eventsQueue.length,
          },
        });
        hmrPerfLogger.point("fileChange_start");
      }
      const changeEvent = {
        logger: hmrPerfLogger,
        eventsQueue,
      };
      this.emit("change", changeEvent);
      nextEmit = null;
    };
    const onChange = (type, filePath, root, metadata) => {
      if (
        metadata &&
        // Ignore all directory events
        (metadata.type === "d" ||
          // Ignore regular files with unwatched extensions
          (metadata.type === "f" && !hasWatchedExtension(filePath)) ||
          // Don't emit events relating to symlinks if enableSymlinks: false
          (!this._options.enableSymlinks && metadata?.type === "l"))
      ) {
        return;
      }
      const absoluteFilePath = path.join(
        root,
        (0, _normalizePathSeparatorsToSystem.default)(filePath)
      );

      // Ignore files (including symlinks) whose path matches ignorePattern
      // (we don't ignore node_modules in watch mode)
      if (this._options.ignorePattern.test(absoluteFilePath)) {
        return;
      }
      const relativeFilePath = fastPath.relative(rootDir, absoluteFilePath);
      const linkStats = fileSystem.linkStats(relativeFilePath);

      // The file has been accessed, not modified. If the modified time is
      // null, then it is assumed that the watcher does not have capabilities
      // to detect modified time, and change processing proceeds.
      if (
        type === "change" &&
        linkStats != null &&
        metadata &&
        metadata.modifiedTime != null &&
        linkStats.modifiedTime === metadata.modifiedTime
      ) {
        return;
      }
      const onChangeStartTime =
        _perf_hooks.performance.timeOrigin + _perf_hooks.performance.now();
      changeQueue = changeQueue
        .then(async () => {
          // If we get duplicate events for the same file, ignore them.
          if (
            nextEmit != null &&
            nextEmit.eventsQueue.find(
              (event) =>
                event.type === type &&
                event.filePath === absoluteFilePath &&
                ((!event.metadata && !metadata) ||
                  (event.metadata &&
                    metadata &&
                    event.metadata.modifiedTime != null &&
                    metadata.modifiedTime != null &&
                    event.metadata.modifiedTime === metadata.modifiedTime))
            )
          ) {
            return null;
          }
          const linkStats = fileSystem.linkStats(relativeFilePath);
          const enqueueEvent = (metadata) => {
            const event = {
              filePath: absoluteFilePath,
              metadata,
              type,
            };
            if (nextEmit == null) {
              nextEmit = {
                eventsQueue: [event],
                firstEventTimestamp: onChangeStartTime,
                firstEnqueuedTimestamp:
                  _perf_hooks.performance.timeOrigin +
                  _perf_hooks.performance.now(),
              };
            } else {
              nextEmit.eventsQueue.push(event);
            }
            return null;
          };

          // If it's not an addition, delete the file and all its metadata
          if (linkStats != null) {
            this._removeIfExists(
              fileSystem,
              hasteMap,
              mockMap,
              relativeFilePath
            );
          }

          // If the file was added or changed,
          // parse it and update the haste map.
          if (type === "add" || type === "change") {
            (0, _invariant.default)(
              metadata != null && metadata.size != null,
              "since the file exists or changed, it should have metadata"
            );
            const fileMetadata = [
              "",
              metadata.modifiedTime,
              metadata.size,
              0,
              "",
              null,
              metadata.type === "l" ? 1 : 0,
            ];
            try {
              await this._processFile(
                hasteMap,
                mockMap,
                absoluteFilePath,
                fileMetadata,
                {
                  forceInBand: true,
                } // No need to clean up workers
              );

              fileSystem.addOrModify(relativeFilePath, fileMetadata);
              enqueueEvent(metadata);
            } catch (e) {
              if (!["ENOENT", "EACCESS"].includes(e.code)) {
                throw e;
              }
              // Swallow ENOENT/ACCESS errors silently. Safe because either:
              // - We never knew about the file, so neither did any consumers.
              // Or,
              // - The watcher will soon (or has already) report a "delete"
              //   event for it, and we'll clean up in the usual way at that
              //   point.
            }
          } else if (type === "delete") {
            if (linkStats == null) {
              // Don't emit deletion events for files we weren't retaining.
              // This is expected for deletion of an ignored file.
              return null;
            }
            enqueueEvent({
              modifiedTime: null,
              size: null,
              type: linkStats.fileType,
            });
          } else {
            throw new Error(
              `metro-file-map: Unrecognized event type from watcher: ${type}`
            );
          }
          return null;
        })
        .catch((error) => {
          this._console.error(
            `metro-file-map: watch error:\n  ${error.stack}\n`
          );
        });
    };
    this._changeInterval = setInterval(emitChange, CHANGE_INTERVAL);
    (0, _invariant.default)(
      this._watcher != null,
      "Expected _watcher to have been initialised by build()"
    );
    await this._watcher.watch(onChange);
    if (this._options.healthCheck.enabled) {
      const performHealthCheck = () => {
        if (!this._watcher) {
          return;
        }
        // $FlowFixMe[unused-promise]
        this._watcher
          .checkHealth(this._options.healthCheck.timeout)
          .then((result) => {
            this.emit("healthCheck", result);
          });
      };
      performHealthCheck();
      this._healthCheckInterval = setInterval(
        performHealthCheck,
        this._options.healthCheck.interval
      );
    }
    this._startupPerfLogger?.point("watch_end");
  }
  async end() {
    if (this._changeInterval) {
      clearInterval(this._changeInterval);
    }
    if (this._healthCheckInterval) {
      clearInterval(this._healthCheckInterval);
    }
    this._crawlerAbortController.abort();
    if (!this._watcher) {
      return;
    }
    await this._watcher.close();
  }

  /**
   * Helpers
   */
  _ignore(filePath) {
    const ignoreMatched = this._options.ignorePattern.test(filePath);
    return (
      ignoreMatched ||
      (!this._options.retainAllFiles && filePath.includes(NODE_MODULES))
    );
  }
  async _shouldUseWatchman() {
    if (!this._options.useWatchman) {
      return false;
    }
    if (!this._canUseWatchmanPromise) {
      this._canUseWatchmanPromise = (0, _checkWatchmanCapabilities.default)(
        WATCHMAN_REQUIRED_CAPABILITIES
      )
        .then(() => true)
        .catch((e) => {
          // TODO: Advise people to either install Watchman or set
          // `useWatchman: false` here?
          this._startupPerfLogger?.annotate({
            string: {
              watchmanFailedCapabilityCheck: e?.message ?? "[missing]",
            },
          });
          return false;
        });
    }
    return this._canUseWatchmanPromise;
  }
  _getNextChangeID() {
    if (this._changeID >= Number.MAX_SAFE_INTEGER) {
      this._changeID = 0;
    }
    return ++this._changeID;
  }
  static H = _constants.default;
}
exports.default = FileMap;
