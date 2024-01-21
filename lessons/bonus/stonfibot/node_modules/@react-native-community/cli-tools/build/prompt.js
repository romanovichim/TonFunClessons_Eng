"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addInteractionListener = addInteractionListener;
exports.pauseInteractions = pauseInteractions;
exports.prompt = prompt;
exports.resumeInteractions = resumeInteractions;
function _prompts() {
  const data = _interopRequireDefault(require("prompts"));
  _prompts = function () {
    return data;
  };
  return data;
}
var _errors = require("./errors");
var _logger = _interopRequireDefault(require("./logger"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/** Interaction observers for detecting when keystroke tracking should pause/resume. */
const listeners = [];
async function prompt(question, options = {}) {
  pauseInteractions();
  try {
    const results = await (0, _prompts().default)(question, {
      onCancel() {
        throw new _errors.CLIError('Prompt cancelled.');
      },
      ...options
    });
    return results;
  } finally {
    resumeInteractions();
  }
}
function pauseInteractions(options = {}) {
  _logger.default.debug('Interaction observers paused');
  for (const listener of listeners) {
    listener({
      pause: true,
      ...options
    });
  }
}

/** Notify all listeners that keypress observations can start.. */
function resumeInteractions(options = {}) {
  _logger.default.debug('Interaction observers resumed');
  for (const listener of listeners) {
    listener({
      pause: false,
      ...options
    });
  }
}

/** Used to pause/resume interaction observers while prompting (made for TerminalUI). */
function addInteractionListener(callback) {
  listeners.push(callback);
}

//# sourceMappingURL=prompt.ts.map