"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.KeyPressHandler = void 0;
var _cliTools = require("@react-native-community/cli-tools");
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

const CTRL_C = "\u0003";

/** An abstract key stroke interceptor. */
class KeyPressHandler {
  _isInterceptingKeyStrokes = false;
  _isHandlingKeyPress = false;
  constructor(onPress) {
    this._onPress = onPress;
  }

  /** Start observing interaction pause listeners. */
  createInteractionListener() {
    // Support observing prompts.
    let wasIntercepting = false;
    const listener = ({ pause }) => {
      if (pause) {
        // Track if we were already intercepting key strokes before pausing, so we can
        // resume after pausing.
        wasIntercepting = this._isInterceptingKeyStrokes;
        this.stopInterceptingKeyStrokes();
      } else if (wasIntercepting) {
        // Only start if we were previously intercepting.
        this.startInterceptingKeyStrokes();
      }
    };
    return listener;
  }
  _handleKeypress = async (key) => {
    // Prevent sending another event until the previous event has finished.
    if (this._isHandlingKeyPress && key !== CTRL_C) {
      return;
    }
    this._isHandlingKeyPress = true;
    try {
      _cliTools.logger.debug(`Key pressed: ${key}`);
      await this._onPress(key);
    } catch (error) {
      return new _cliTools.CLIError(
        "There was an error with the key press handler."
      );
    } finally {
      this._isHandlingKeyPress = false;
    }
  };

  /** Start intercepting all key strokes and passing them to the input `onPress` method. */
  startInterceptingKeyStrokes() {
    if (this._isInterceptingKeyStrokes) {
      return;
    }
    this._isInterceptingKeyStrokes = true;
    const { stdin } = process;
    // $FlowFixMe[prop-missing]
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    stdin.on("data", this._handleKeypress);
  }

  /** Stop intercepting all key strokes. */
  stopInterceptingKeyStrokes() {
    if (!this._isInterceptingKeyStrokes) {
      return;
    }
    this._isInterceptingKeyStrokes = false;
    const { stdin } = process;
    stdin.removeListener("data", this._handleKeypress);
    // $FlowFixMe[prop-missing]
    stdin.setRawMode(false);
    stdin.resume();
  }
}
exports.KeyPressHandler = KeyPressHandler;
