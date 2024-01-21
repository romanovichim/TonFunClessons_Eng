"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
var _assert = _interopRequireDefault(require("assert"));
var _path = require("path");
var _resolve = require("resolve");
var resolve = _interopRequireWildcard(require("resolve.exports"));
var _dir = require("../../../utils/dir");
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
const defaultResolver = (path, { enablePackageExports , blockList =[] , ...options })=>{
    // @ts-expect-error
    const resolveOptions = {
        ...options,
        isDirectory (file) {
            if (blockList.some((regex)=>regex.test(file)
            )) {
                return false;
            }
            return (0, _dir).directoryExistsSync(file);
        },
        isFile (file) {
            if (blockList.some((regex)=>regex.test(file)
            )) {
                return false;
            }
            return (0, _dir).fileExistsSync(file);
        },
        preserveSymlinks: options.preserveSymlinks,
        defaultResolver
    };
    // resolveSync dereferences symlinks to ensure we don't create a separate
    // module instance depending on how it was referenced.
    const result = (0, _resolve).sync(enablePackageExports ? getPathInModule(path, resolveOptions) : path, {
        ...resolveOptions,
        preserveSymlinks: !options.preserveSymlinks
    });
    return result;
};
var _default = defaultResolver;
exports.default = _default;
/*
 * helper functions
 */ function getPathInModule(path, options) {
    if (shouldIgnoreRequestForExports(path)) {
        return path;
    }
    const segments = path.split("/");
    let moduleName = segments.shift();
    if (moduleName) {
        if (moduleName.startsWith("@")) {
            moduleName = `${moduleName}/${segments.shift()}`;
        }
        // Disable package exports for babel/runtime for https://github.com/facebook/metro/issues/984/
        if (moduleName === "@babel/runtime") {
            return path;
        }
        // self-reference
        const closestPackageJson = findClosestPackageJson(options.basedir, options);
        if (closestPackageJson) {
            const pkg = options.readPackageSync(options.readFileSync, closestPackageJson);
            (0, _assert).default(pkg, "package.json should be read by `readPackageSync`");
            if (pkg.name === moduleName) {
                const resolved = resolve.exports(pkg, segments.join("/") || ".", createResolveOptions(options.conditions));
                if (resolved) {
                    return (0, _path).resolve((0, _path).dirname(closestPackageJson), resolved[0]);
                }
                if (pkg.exports) {
                    throw new Error("`exports` exists, but no results - this is a bug in Expo CLI's Metro resolver. Please report an issue");
                }
            }
        }
        let packageJsonPath = "";
        try {
            packageJsonPath = (0, _resolve).sync(`${moduleName}/package.json`, options);
        } catch  {
        // ignore if package.json cannot be found
        }
        if (packageJsonPath && options.isFile(packageJsonPath)) {
            const pkg = options.readPackageSync(options.readFileSync, packageJsonPath);
            (0, _assert).default(pkg, "package.json should be read by `readPackageSync`");
            const resolved = resolve.exports(pkg, segments.join("/") || ".", createResolveOptions(options.conditions));
            if (resolved) {
                return (0, _path).resolve((0, _path).dirname(packageJsonPath), resolved[0]);
            }
            if (pkg.exports) {
                throw new Error("`exports` exists, but no results - this is a bug in Expo CLI's Metro resolver. Please report an issue");
            }
        }
    }
    return path;
}
function createResolveOptions(conditions) {
    return conditions ? {
        conditions,
        unsafe: true
    } : {
        browser: false,
        require: true
    };
}
// if it's a relative import or an absolute path, imports/exports are ignored
const shouldIgnoreRequestForExports = (path)=>path.startsWith(".") || (0, _path).isAbsolute(path)
;
// adapted from
// https://github.com/lukeed/escalade/blob/2477005062cdbd8407afc90d3f48f4930354252b/src/sync.js
function findClosestPackageJson(start, options) {
    let dir = (0, _path).resolve(".", start);
    if (!options.isDirectory(dir)) {
        dir = (0, _path).dirname(dir);
    }
    while(true){
        const pkgJsonFile = (0, _path).resolve(dir, "./package.json");
        const hasPackageJson = options.isFile(pkgJsonFile);
        if (hasPackageJson) {
            return pkgJsonFile;
        }
        const prevDir = dir;
        dir = (0, _path).dirname(dir);
        if (prevDir === dir) {
            return undefined;
        }
    }
}

//# sourceMappingURL=createJResolver.js.map