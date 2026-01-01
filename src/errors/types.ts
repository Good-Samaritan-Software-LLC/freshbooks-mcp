/**
 * Error Type Definitions
 *
 * Comprehensive type definitions for the dual-format error system.
 * All errors are normalized to MCP format while preserving original
 * FreshBooks error details for debugging.
 */

/**
 * MCP Error Codes (JSON-RPC 2.0)
 *
 * Standard JSON-RPC error codes (-32768 to -32000) plus
 * custom application errors (-32000 to -32099)
 */
export enum MCPErrorCode {
  // Standard JSON-RPC 2.0 errors
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,

  // Custom application errors (range: -32000 to -32099)
  NOT_AUTHENTICATED = -32001,
  TOKEN_EXPIRED = -32002,
  PERMISSION_DENIED = -32003,
  RATE_LIMITED = -32004,
  RESOURCE_NOT_FOUND = -32005,
  VALIDATION_ERROR = -32006,
  CONFLICT = -32007,
  SERVICE_UNAVAILABLE = -32008,
  NETWORK_ERROR = -32009,
  TIMEOUT = -32010,
}

/**
 * FreshBooks Error Codes
 *
 * Error codes as returned by the FreshBooks API.
 * These are mapped to MCP error codes for client consumption.
 */
export enum FreshBooksErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  CONFLICT = "CONFLICT",
  BAD_REQUEST = "BAD_REQUEST",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  UNAUTHENTICATED = "UNAUTHENTICATED",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  INVALID_GRANT = "INVALID_GRANT",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
}

/**
 * Normalized MCP Error
 *
 * All errors are transformed into this format before being
 * sent to the client. Follows JSON-RPC 2.0 error object spec.
 */
export interface MCPError extends Error {
  code: MCPErrorCode;
  message: string;
  data: MCPErrorData;
}

/**
 * Error Data
 *
 * Preserves original FreshBooks error details while adding
 * context and recovery guidance.
 */
export interface MCPErrorData {
  // Original FreshBooks error (preserved for debugging)
  freshbooksError?: {
    code: string;
    message: string;
    field?: string;
    errno?: number;
    details?: Record<string, unknown>;
    statusCode?: number;
    type?: string;
  };

  // Validation errors (from Zod)
  validationErrors?: Array<{
    path: string;
    message: string;
    code: string;
    expected?: string;
    received?: unknown;
  }>;

  // Additional context
  context?: ErrorContext;

  // Recovery guidance
  recoverable: boolean;
  suggestion?: string;
  retryAfter?: number; // seconds, for rate limiting
  authUrl?: string; // for auth errors
  statusCode?: number; // HTTP status code
}

/**
 * Error Context
 *
 * Contextual information about where and why the error occurred.
 */
export interface ErrorContext {
  tool?: string;
  accountId?: string;
  entityId?: number | string;
  requestId?: string;
  operation?: string;
  [key: string]: unknown;
}

/**
 * FreshBooks API Error
 *
 * The error structure returned by the FreshBooks SDK.
 */
export interface FreshBooksApiError {
  ok: false;
  error: {
    code: string;
    message: string;
    field?: string;
    errno?: number;
    details?: Record<string, unknown>;
    type?: string;
  };
  statusCode?: number;
  retryAfter?: number;
}

/**
 * OAuth Error
 *
 * Errors from the OAuth flow.
 */
export class OAuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "OAuthError";
  }
}

/**
 * OAuth Error Response
 *
 * Error structure from OAuth token endpoints.
 */
export interface OAuthErrorResponse {
  error: string;
  error_description?: string;
  error_uri?: string;
}

/**
 * Error Mapping Configuration
 *
 * Configuration for mapping error types to MCP errors.
 */
export interface ErrorMapping {
  mcpCode: MCPErrorCode;
  recoverable: boolean;
  getMessage: (error: FreshBooksApiError["error"]) => string;
  getSuggestion: (error: FreshBooksApiError["error"]) => string;
  statusCode?: number;
}

/**
 * Tool Context
 *
 * Context passed to tool handlers.
 */
export interface ToolContext {
  accountId?: string;
  [key: string]: unknown;
}

/**
 * Network Error Type
 *
 * Common network error codes from Node.js.
 */
export enum NetworkErrorType {
  TIMEOUT = "ETIMEDOUT",
  CONNECTION_REFUSED = "ECONNREFUSED",
  NOT_FOUND = "ENOTFOUND",
  CONNECTION_RESET = "ECONNRESET",
  NETWORK_UNREACHABLE = "ENETUNREACH",
  DNS_FAILURE = "EAI_AGAIN",
}

/**
 * Type guard: Check if error is an MCP error
 */
export function isMCPError(error: unknown): error is MCPError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    "data" in error &&
    typeof (error as MCPError).code === "number" &&
    typeof (error as MCPError).message === "string"
  );
}

/**
 * Type guard: Check if error is a FreshBooks API error
 */
export function isFreshBooksError(error: unknown): error is FreshBooksApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "ok" in error &&
    (error as FreshBooksApiError).ok === false &&
    "error" in error &&
    typeof (error as FreshBooksApiError).error === "object"
  );
}

/**
 * Type guard: Check if error is an OAuth error
 */
export function isOAuthError(error: unknown): error is OAuthError {
  return error instanceof OAuthError;
}

/**
 * Type guard: Check if error is a network error
 */
export function isNetworkError(error: unknown): error is NodeJS.ErrnoException {
  if (!(error instanceof Error)) {
    return false;
  }

  const networkIndicators = [
    "ETIMEDOUT",
    "ECONNREFUSED",
    "ENOTFOUND",
    "ECONNRESET",
    "ENETUNREACH",
    "EAI_AGAIN",
    "socket hang up",
    "network",
    "timeout",
  ];

  return networkIndicators.some((indicator) =>
    error.message.toLowerCase().includes(indicator.toLowerCase())
  );
}
