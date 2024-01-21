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

export type Page = { id: string; title: string; vm: string; app: string };
export type WrappedEvent = {
  event: "wrappedEvent";
  payload: { pageId: string; wrappedEvent: string };
};
export type ConnectRequest = { event: "connect"; payload: { pageId: string } };
export type DisconnectRequest = {
  event: "disconnect";
  payload: { pageId: string };
};
export type GetPagesRequest = { event: "getPages" };
export type GetPagesResponse = { event: "getPages"; payload: Array<Page> };
export type MessageFromDevice =
  | GetPagesResponse
  | WrappedEvent
  | DisconnectRequest;
export type MessageToDevice =
  | GetPagesRequest
  | WrappedEvent
  | ConnectRequest
  | DisconnectRequest;
export type PageDescription = {
  id: string;
  description: string;
  title: string;
  faviconUrl: string;
  devtoolsFrontendUrl: string;
  type: string;
  webSocketDebuggerUrl: string;
};
export type JsonPagesListResponse = Array<PageDescription>;
export type JsonVersionResponse = {
  Browser: string;
  "Protocol-Version": string;
};
/**
 * Types were exported from https://github.com/ChromeDevTools/devtools-protocol/blob/master/types/protocol.d.ts
 */

export type SetBreakpointByUrlRequest = {
  id: number;
  method: "Debugger.setBreakpointByUrl";
  params: {
    lineNumber: number;
    url?: string;
    urlRegex?: string;
    scriptHash?: string;
    columnNumber?: number;
    condition?: string;
  };
};
export type GetScriptSourceRequest = {
  id: number;
  method: "Debugger.getScriptSource";
  params: { scriptId: string };
};
export type GetScriptSourceResponse = {
  scriptSource: string;
  /**
   * Wasm bytecode.
   */
  bytecode?: string;
};
export type ErrorResponse = { error: { message: string } };
export type DebuggerRequest =
  | SetBreakpointByUrlRequest
  | GetScriptSourceRequest;
