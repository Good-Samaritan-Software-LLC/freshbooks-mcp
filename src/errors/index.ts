/**
 * Error System
 *
 * Comprehensive error handling for the FreshBooks MCP server.
 *
 * This module provides a dual-format error system:
 * - All errors normalized to MCP JSON-RPC format for clients
 * - Original FreshBooks errors preserved in data field for debugging
 *
 * @module errors
 */

// Types
export type {
  MCPError,
  MCPErrorData,
  ErrorContext,
  FreshBooksApiError,
  ErrorMapping,
  ToolContext,
} from "./types.js";

export {
  MCPErrorCode,
  FreshBooksErrorCode,
  OAuthError,
} from "./types.js";

// Error Mapping
export { ErrorMapper } from "./error-mapper.js";

// Error Handling
export { ErrorHandler, generateRequestId, handleError, createAuthError } from "./error-handler.js";

// Re-export MCPErrorCode enum for convenience
import { MCPErrorCode as _MCPErrorCode } from "./types.js";

/**
 * Re-export commonly used error codes for convenience
 */
export const ErrorCodes = {
  // JSON-RPC standard errors
  PARSE_ERROR: _MCPErrorCode.PARSE_ERROR,
  INVALID_REQUEST: _MCPErrorCode.INVALID_REQUEST,
  METHOD_NOT_FOUND: _MCPErrorCode.METHOD_NOT_FOUND,
  INVALID_PARAMS: _MCPErrorCode.INVALID_PARAMS,
  INTERNAL_ERROR: _MCPErrorCode.INTERNAL_ERROR,

  // Application errors
  NOT_AUTHENTICATED: _MCPErrorCode.NOT_AUTHENTICATED,
  TOKEN_EXPIRED: _MCPErrorCode.TOKEN_EXPIRED,
  PERMISSION_DENIED: _MCPErrorCode.PERMISSION_DENIED,
  RATE_LIMITED: _MCPErrorCode.RATE_LIMITED,
  RESOURCE_NOT_FOUND: _MCPErrorCode.RESOURCE_NOT_FOUND,
  VALIDATION_ERROR: _MCPErrorCode.VALIDATION_ERROR,
  CONFLICT: _MCPErrorCode.CONFLICT,
  SERVICE_UNAVAILABLE: _MCPErrorCode.SERVICE_UNAVAILABLE,
  NETWORK_ERROR: _MCPErrorCode.NETWORK_ERROR,
  TIMEOUT: _MCPErrorCode.TIMEOUT,
} as const;
