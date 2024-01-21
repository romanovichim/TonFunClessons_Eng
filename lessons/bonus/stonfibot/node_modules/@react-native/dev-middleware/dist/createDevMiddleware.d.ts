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
import type { BrowserLauncher } from "./types/BrowserLauncher";
import type { EventReporter } from "./types/EventReporter";
import type { ExperimentsConfig } from "./types/Experiments";
import type { Logger } from "./types/Logger";
import InspectorProxy from "./inspector-proxy/InspectorProxy";
type Options = Readonly<{
  projectRoot: string;
  /**
   * The base URL to the dev server, as addressible from the local developer
   * machine. This is used in responses which return URLs to other endpoints,
   * e.g. the debugger frontend and inspector proxy targets.
   *
   * Example: `'http://localhost:8081'`.
   */
  serverBaseUrl: string;
  logger?: Logger;
  /**
   * An interface for integrators to provide a custom implementation for
   * opening URLs in a web browser.
   *
   * This is an unstable API with no semver guarantees.
   */
  unstable_browserLauncher?: BrowserLauncher;
  /**
   * An interface for logging events.
   *
   * This is an unstable API with no semver guarantees.
   */
  unstable_eventReporter?: EventReporter;
  /**
   * The set of experimental features to enable.
   *
   * This is an unstable API with no semver guarantees.
   */
  unstable_experiments?: ExperimentsConfig;
  /**
   * An interface for using a modified inspector proxy implementation.
   *
   * This is an unstable API with no semver guarantees.
   */
  unstable_InspectorProxy?: new (...args: any[]) => InspectorProxy;
}>;
type DevMiddlewareAPI = Readonly<{
  middleware: NextHandleFunction;
  websocketEndpoints: { [path: string]: ws$WebSocketServer };
}>;
declare function createDevMiddleware($$PARAM_0$$: Options): DevMiddlewareAPI;
export default createDevMiddleware;
