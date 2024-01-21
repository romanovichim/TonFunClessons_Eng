"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.respond = respond;
exports.getDebuggerType = getDebuggerType;
function respond(socket, message) {
    socket.send(JSON.stringify(message));
    return true;
}
// Patterns to test against user agents
const CHROME_USER_AGENT = /chrome/i;
const VSCODE_USER_AGENT = /vscode/i;
function getDebuggerType(userAgent) {
    if (userAgent && CHROME_USER_AGENT.test(userAgent)) return "chrome";
    if (userAgent && VSCODE_USER_AGENT.test(userAgent)) return "vscode";
    return "unknown";
}

//# sourceMappingURL=utils.js.map