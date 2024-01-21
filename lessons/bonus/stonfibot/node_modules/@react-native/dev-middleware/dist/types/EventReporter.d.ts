/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

type SuccessResult<Props extends {} | void = {}> =
  /**
   * > 13 |   ...Props,
   *      |   ^^^^^^^^ Unsupported feature: Translating "object types with spreads in the middle or at the end" is currently not supported.
   **/
  any;
type ErrorResult<ErrorT = unknown> = { status: "error"; error: ErrorT };
type CodedErrorResult<ErrorCode extends string> = {
  status: "coded_error";
  errorCode: ErrorCode;
  errorDetails?: string;
};
type DebuggerSessionIDs = {
  appId: string;
  deviceName: string;
  deviceId: string;
  pageId: string | null;
};
export type ReportableEvent =
  | /**
   * > 38 |       ...
   *      |       ^^^
   * > 39 |         | SuccessResult<{ appId: string }>
   *      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   * > 40 |         | ErrorResult<mixed>
   *      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   * > 41 |         | CodedErrorResult<"NO_APPS_FOUND">,
   *      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Unsupported feature: Translating "object types with spreads in the middle or at the end" is currently not supported.
   **/
  any
  | /**
   * > 45 |       ...
   *      |       ^^^
   * > 46 |         | SuccessResult<{
   *      | ^^^^^^^^^^^^^^^^^^^^^^^^^
   * > 47 |             ...DebuggerSessionIDs,
   *      | ^^^^^^^^^^^^^^^^^^^^^^^^^
   * > 48 |             frontendUserAgent: string | null,
   *      | ^^^^^^^^^^^^^^^^^^^^^^^^^
   * > 49 |           }>
   *      | ^^^^^^^^^^^^^^^^^^^^^^^^^
   * > 50 |         | ErrorResult<mixed>,
   *      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Unsupported feature: Translating "object types with spreads in the middle or at the end" is currently not supported.
   **/
  any
  | /**
   * > 60 |       ...DebuggerSessionIDs,
   *      |       ^^^^^^^^^^^^^^^^^^^^^ Unsupported feature: Translating "object types with spreads in the middle or at the end" is currently not supported.
   **/
  any;
/**
 * A simple interface for logging events, to be implemented by integrators of
 * `dev-middleware`.
 *
 * This is an unstable API with no semver guarantees.
 */
export interface EventReporter {
  logEvent(event: ReportableEvent): void;
}
