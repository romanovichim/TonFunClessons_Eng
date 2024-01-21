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

import type {
  JsonPagesListResponse,
  JsonVersionResponse,
  Page,
  PageDescription,
} from "./types";
import type { EventReporter } from "../types/EventReporter";
import type { Experiments } from "../types/Experiments";
import type { IncomingMessage, ServerResponse } from "http";
import WS from "ws";
import Device from "./Device";
export interface InspectorProxyQueries {
  getPageDescriptions(): Array<PageDescription>;
}
/**
 * Main Inspector Proxy class that connects JavaScript VM inside Android/iOS apps and JS debugger.
 */
declare class InspectorProxy implements InspectorProxyQueries {
  _projectRoot: string;
  _serverBaseUrl: string;
  _devices: Map<string, Device>;
  _deviceCounter: number;
  _eventReporter: null | undefined | EventReporter;
  _experiments: Experiments;
  constructor(
    projectRoot: string,
    serverBaseUrl: string,
    eventReporter: null | undefined | EventReporter,
    experiments: Experiments
  );
  getPageDescriptions(): Array<PageDescription>;
  processRequest(
    request: IncomingMessage,
    response: ServerResponse,
    next: ($$PARAM_0$$: null | undefined | Error) => unknown
  ): void;
  createWebSocketListeners(): { [path: string]: WS.Server };
  _buildPageDescription(
    deviceId: string,
    device: Device,
    page: Page
  ): PageDescription;
  _sendJsonResponse(
    response: ServerResponse,
    object: JsonPagesListResponse | JsonVersionResponse
  ): void;
  _createDeviceConnectionWSServer(): ws$WebSocketServer;
  _createDebuggerConnectionWSServer(): ws$WebSocketServer;
}
export default InspectorProxy;
