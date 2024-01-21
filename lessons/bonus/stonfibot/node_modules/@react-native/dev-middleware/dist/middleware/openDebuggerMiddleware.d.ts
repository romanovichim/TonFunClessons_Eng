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

import type { NextHandleFunction } from "connect";
import type { InspectorProxyQueries } from "../inspector-proxy/InspectorProxy";
import type { BrowserLauncher } from "../types/BrowserLauncher";
import type { EventReporter } from "../types/EventReporter";
import type { Experiments } from "../types/Experiments";
import type { Logger } from "../types/Logger";
type Options = Readonly<{
  serverBaseUrl: string;
  logger?: Logger;
  browserLauncher: BrowserLauncher;
  eventReporter?: EventReporter;
  experiments: Experiments;
  inspectorProxy: InspectorProxyQueries;
}>;
/**
 * Open the JavaScript debugger for a given CDP target (direct Hermes debugging).
 *
 * Currently supports Hermes targets, opening debugger websocket URL in Chrome
 * DevTools.
 *
 * @see https://chromedevtools.github.io/devtools-protocol/
 */
declare function openDebuggerMiddleware(
  $$PARAM_0$$: Options
): NextHandleFunction;
export default openDebuggerMiddleware;
