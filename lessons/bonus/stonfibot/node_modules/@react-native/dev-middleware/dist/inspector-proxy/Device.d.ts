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
  DebuggerRequest,
  GetScriptSourceRequest,
  MessageFromDevice,
  MessageToDevice,
  Page,
  SetBreakpointByUrlRequest,
} from "./types";
import DeviceEventReporter from "./DeviceEventReporter";
import WS from "ws";
import type { EventReporter } from "../types/EventReporter";
type DebuggerInfo = {
  socket: WS;
  originalSourceURLAddress?: string;
  prependedFilePrefix: boolean;
  pageId: string;
  userAgent: string | null;
};
/**
 * Device class represents single device connection to Inspector Proxy. Each device
 * can have multiple inspectable pages.
 */
declare class Device {
  _id: string;
  _name: string;
  _app: string;
  _deviceSocket: WS;
  _pages: Array<Page>;
  _debuggerConnection: null | undefined | DebuggerInfo;
  _lastConnectedReactNativePage: null | undefined | Page;
  _isReloading: boolean;
  _lastGetPagesMessage: string;
  _scriptIdToSourcePathMapping: Map<string, string>;
  _projectRoot: string;
  _deviceEventReporter: null | undefined | DeviceEventReporter;
  constructor(
    id: string,
    name: string,
    app: string,
    socket: WS,
    projectRoot: string,
    eventReporter: null | undefined | EventReporter
  );
  getName(): string;
  getApp(): string;
  getPagesList(): Array<Page>;
  handleDebuggerConnection(
    socket: WS,
    pageId: string,
    metadata: Readonly<{ userAgent: string | null }>
  ): void;
  handleDuplicateDeviceConnection(newDevice: Device): void;
  _handleMessageFromDevice(message: MessageFromDevice): void;
  _sendMessageToDevice(message: MessageToDevice): void;
  _setPagesPolling(): void;
  _newReactNativePage(page: Page): void;
  _processMessageFromDevice(
    payload: { method: string; params: { sourceMapURL: string; url: string } },
    debuggerInfo: DebuggerInfo
  ): void;
  _interceptMessageFromDebugger(
    req: DebuggerRequest,
    debuggerInfo: DebuggerInfo,
    socket: WS
  ): boolean;
  _processDebuggerSetBreakpointByUrl(
    req: SetBreakpointByUrlRequest,
    debuggerInfo: DebuggerInfo
  ): void;
  _processDebuggerGetScriptSource(
    req: GetScriptSourceRequest,
    socket: WS
  ): void;
  _mapToDevicePageId(pageId: string): string;
  _tryParseHTTPURL(url: string): null | undefined | URL;
  _fetchText(url: URL): Promise<string>;
  _sendErrorToDebugger(message: string): void;
}
export default Device;
