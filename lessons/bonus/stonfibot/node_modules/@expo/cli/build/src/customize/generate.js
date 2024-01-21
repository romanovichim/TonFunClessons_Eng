"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.queryAndGenerateAsync = queryAndGenerateAsync;
exports.selectAndGenerateAsync = selectAndGenerateAsync;
var _path = _interopRequireDefault(require("path"));
var _resolveFrom = _interopRequireDefault(require("resolve-from"));
var _templates = require("./templates");
var _installAsync = require("../install/installAsync");
var _log = require("../log");
var _dir = require("../utils/dir");
var _errors = require("../utils/errors");
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
async function queryAndGenerateAsync(projectRoot, { files , props , extras  }) {
    const valid = files.filter((file)=>!!_templates.TEMPLATES.find((template)=>template.destination(props) === file
        )
    );
    if (valid.length !== files.length) {
        const diff = files.filter((file)=>!_templates.TEMPLATES.find((template)=>template.destination(props) === file
            )
        );
        throw new _errors.CommandError(`Invalid files: ${diff.join(", ")}. Allowed: ${_templates.TEMPLATES.map((template)=>template.destination(props)
        ).join(", ")}`);
    }
    if (!valid.length) {
        return;
    }
    _log.Log.log(`Generating: ${valid.join(", ")}`);
    return generateAsync(projectRoot, {
        answer: files.map((file)=>_templates.TEMPLATES.findIndex((template)=>template.destination(props) === file
            )
        ),
        props,
        extras
    });
}
async function selectAndGenerateAsync(projectRoot, { props , extras  }) {
    const answer = await (0, _templates).selectTemplatesAsync(projectRoot, props);
    if (!(answer == null ? void 0 : answer.length)) {
        _log.Log.exit("\n\u203A Exiting with no change...", 0);
    }
    await generateAsync(projectRoot, {
        answer,
        props,
        extras
    });
}
async function generateAsync(projectRoot, { answer , props , extras  }) {
    // Copy files
    await Promise.all(answer.map(async (file)=>{
        const template = _templates.TEMPLATES[file];
        if (template.id === "tsconfig.json") {
            const { typescript  } = await Promise.resolve().then(function() {
                return _interopRequireWildcard(require("./typescript.js"));
            });
            return typescript(projectRoot);
        }
        const projectFilePath = _path.default.resolve(projectRoot, template.destination(props));
        // copy the file from template
        return (0, _dir).copyAsync(template.file(projectRoot), projectFilePath, {
            overwrite: true,
            recursive: true
        });
    }));
    // Install dependencies
    const packages = answer.map((file)=>_templates.TEMPLATES[file].dependencies
    ).flat().filter((pkg)=>!_resolveFrom.default.silent(projectRoot, pkg)
    );
    if (packages.length) {
        _log.Log.debug("Installing " + packages.join(", "));
        await (0, _installAsync).installAsync(packages, {}, [
            "--dev",
            ...extras
        ]);
    }
}

//# sourceMappingURL=generate.js.map