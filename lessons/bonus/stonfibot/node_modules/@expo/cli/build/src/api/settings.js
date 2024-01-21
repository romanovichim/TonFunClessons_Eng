"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.disableNetwork = disableNetwork;
var _chalk = _interopRequireDefault(require("chalk"));
var _log = require("../log");
var _env = require("../utils/env");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function disableNetwork() {
    if (_env.env.EXPO_OFFLINE) return;
    process.env.EXPO_OFFLINE = "1";
    _log.Log.log(_chalk.default.gray("Networking has been disabled"));
}

//# sourceMappingURL=settings.js.map