/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

import type { EventReporter } from "../types/EventReporter";
import TTLCache from "@isaacs/ttlcache";
type PendingCommand = {
  method: string;
  requestOrigin: "proxy" | "debugger";
  requestTime: number;
  metadata: RequestMetadata;
};
type DeviceMetadata = Readonly<{
  appId: string;
  deviceId: string;
  deviceName: string;
}>;
type RequestMetadata = Readonly<{
  pageId: string | null;
  frontendUserAgent: string | null;
}>;
declare class DeviceEventReporter {
  _eventReporter: EventReporter;
  _pendingCommands: TTLCache<number, PendingCommand>;
  _metadata: DeviceMetadata;
  constructor(eventReporter: EventReporter, metadata: DeviceMetadata);
  logRequest(
    req: Readonly<{ id: number; method: string }>,
    origin: "debugger" | "proxy",
    metadata: RequestMetadata
  ): void;
  logResponse(
    res: Readonly<{ id: number; error?: { message: string; data?: unknown } }>,
    origin: "device" | "proxy",
    metadata: Readonly<{
      pageId: string | null;
      frontendUserAgent: string | null;
    }>
  ): void;
  logConnection(
    connectedEntity: "debugger",
    metadata: Readonly<{ pageId: string; frontendUserAgent: string | null }>
  ): void;
  logDisconnection(disconnectedEntity: "device" | "debugger"): void;
  _logExpiredCommand(pendingCommand: PendingCommand): void;
}
export default DeviceEventReporter;
