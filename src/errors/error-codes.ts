/**
 * MCP and FreshBooks error code definitions
 */

/**
 * Standard JSON-RPC error codes used by MCP
 */
export const MCP_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;

/**
 * Custom error codes for FreshBooks MCP server
 * Range: -32000 to -32099 (reserved for implementation-defined server errors)
 */
export const FRESHBOOKS_ERROR_CODES = {
  // Authentication errors (-32000 to -32009)
  AUTH_REQUIRED: -32000,
  AUTH_INVALID: -32001,
  AUTH_EXPIRED: -32002,
  AUTH_REFRESH_FAILED: -32003,

  // API errors (-32010 to -32019)
  API_ERROR: -32010,
  API_RATE_LIMIT: -32011,
  API_NOT_FOUND: -32012,
  API_VALIDATION: -32013,

  // Resource errors (-32020 to -32029)
  RESOURCE_NOT_FOUND: -32020,
  RESOURCE_CONFLICT: -32021,
  RESOURCE_INVALID: -32022,

  // Network errors (-32030 to -32039)
  NETWORK_ERROR: -32030,
  TIMEOUT: -32031,
} as const;

/**
 * Error code to human-readable message mapping
 */
export const ERROR_MESSAGES: Record<number, string> = {
  // Standard JSON-RPC
  [MCP_ERROR_CODES.PARSE_ERROR]: 'Invalid JSON was received',
  [MCP_ERROR_CODES.INVALID_REQUEST]: 'The JSON sent is not a valid request',
  [MCP_ERROR_CODES.METHOD_NOT_FOUND]: 'The method does not exist or is not available',
  [MCP_ERROR_CODES.INVALID_PARAMS]: 'Invalid method parameters',
  [MCP_ERROR_CODES.INTERNAL_ERROR]: 'Internal server error',

  // Authentication
  [FRESHBOOKS_ERROR_CODES.AUTH_REQUIRED]: 'Authentication required',
  [FRESHBOOKS_ERROR_CODES.AUTH_INVALID]: 'Invalid authentication credentials',
  [FRESHBOOKS_ERROR_CODES.AUTH_EXPIRED]: 'Authentication token expired',
  [FRESHBOOKS_ERROR_CODES.AUTH_REFRESH_FAILED]: 'Failed to refresh authentication token',

  // API
  [FRESHBOOKS_ERROR_CODES.API_ERROR]: 'FreshBooks API error',
  [FRESHBOOKS_ERROR_CODES.API_RATE_LIMIT]: 'API rate limit exceeded',
  [FRESHBOOKS_ERROR_CODES.API_NOT_FOUND]: 'Resource not found in FreshBooks',
  [FRESHBOOKS_ERROR_CODES.API_VALIDATION]: 'Validation error from FreshBooks API',

  // Resources
  [FRESHBOOKS_ERROR_CODES.RESOURCE_NOT_FOUND]: 'Requested resource not found',
  [FRESHBOOKS_ERROR_CODES.RESOURCE_CONFLICT]: 'Resource conflict',
  [FRESHBOOKS_ERROR_CODES.RESOURCE_INVALID]: 'Invalid resource data',

  // Network
  [FRESHBOOKS_ERROR_CODES.NETWORK_ERROR]: 'Network communication error',
  [FRESHBOOKS_ERROR_CODES.TIMEOUT]: 'Request timeout',
};

/**
 * Determine if an error is recoverable (user can retry)
 */
export function isRecoverable(code: number): boolean {
  const recoverableCodes: number[] = [
    FRESHBOOKS_ERROR_CODES.AUTH_EXPIRED,
    FRESHBOOKS_ERROR_CODES.API_RATE_LIMIT,
    FRESHBOOKS_ERROR_CODES.NETWORK_ERROR,
    FRESHBOOKS_ERROR_CODES.TIMEOUT,
  ];

  return recoverableCodes.includes(code);
}

/**
 * Get suggestion for error resolution
 */
export function getSuggestion(code: number): string | undefined {
  const suggestions: Partial<Record<number, string>> = {
    [FRESHBOOKS_ERROR_CODES.AUTH_REQUIRED]: 'Call auth_get_url to start authentication',
    [FRESHBOOKS_ERROR_CODES.AUTH_INVALID]: 'Re-authenticate using auth_get_url',
    [FRESHBOOKS_ERROR_CODES.AUTH_EXPIRED]: 'Token will be automatically refreshed, please retry',
    [FRESHBOOKS_ERROR_CODES.AUTH_REFRESH_FAILED]: 'Re-authenticate using auth_get_url',
    [FRESHBOOKS_ERROR_CODES.API_RATE_LIMIT]: 'Wait a moment and retry the request',
    [FRESHBOOKS_ERROR_CODES.API_NOT_FOUND]: 'Verify the resource ID and account ID are correct',
    [FRESHBOOKS_ERROR_CODES.API_VALIDATION]: 'Check the input parameters and try again',
    [FRESHBOOKS_ERROR_CODES.NETWORK_ERROR]: 'Check network connection and retry',
    [FRESHBOOKS_ERROR_CODES.TIMEOUT]: 'Retry the request',
  };

  return suggestions[code];
}
