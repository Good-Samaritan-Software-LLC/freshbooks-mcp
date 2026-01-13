/**
 * Response Formatter
 *
 * Formats errors for different output contexts:
 * - JSON-RPC response format (for MCP protocol)
 * - Claude-friendly text format (for display)
 */

import { MCPError } from "./types.js";
import { isProduction } from "../config/environment.js";

/**
 * Format MCPError for JSON-RPC 2.0 error response
 *
 * Creates a properly formatted JSON-RPC error response object
 * that can be sent over the MCP protocol.
 *
 * @param error - The normalized MCP error
 * @param requestId - Optional request ID (null for notifications)
 * @returns JSON-RPC error response object
 *
 * @example
 * ```typescript
 * const response = formatErrorResponse(mcpError, "req-123");
 * // Returns:
 * // {
 * //   jsonrpc: "2.0",
 * //   id: "req-123",
 * //   error: {
 * //     code: -32005,
 * //     message: "Resource not found",
 * //     data: { ... }
 * //   }
 * // }
 * ```
 */
export function formatErrorResponse(
  error: MCPError,
  requestId?: string | number | null
): object {
  return {
    jsonrpc: "2.0",
    id: requestId ?? null,
    error: {
      code: error.code,
      message: error.message,
      data: error.data,
    },
  };
}

/**
 * Format error for Claude-friendly display
 *
 * Creates a markdown-formatted, human-readable error message
 * that Claude can present to the user with actionable guidance.
 *
 * @param error - The normalized MCP error
 * @returns Formatted error message with suggestions
 *
 * @example
 * ```typescript
 * const display = formatErrorForClaude(mcpError);
 * // Returns:
 * // **Error:** Resource not found
 * //
 * // **Suggestion:** Verify the ID is correct...
 * //
 * // *This error cannot be recovered by retrying.*
 * ```
 */
export function formatErrorForClaude(error: MCPError): string {
  const parts: string[] = [`**Error:** ${error.message}`];

  // Add suggestion if available
  if (error.data.suggestion) {
    parts.push(`**Suggestion:** ${error.data.suggestion}`);
  }

  // Add field information for validation errors
  if (error.data.freshbooksError?.field) {
    parts.push(`**Field:** ${error.data.freshbooksError.field}`);
  }

  // Add validation error details
  if (error.data.validationErrors && error.data.validationErrors.length > 0) {
    const validationDetails = error.data.validationErrors
      .map((ve) => `- ${ve.path}: ${ve.message}`)
      .join("\n");
    parts.push(`**Validation Errors:**\n${validationDetails}`);
  }

  // Add retry information for rate limiting
  if (error.data.retryAfter) {
    parts.push(`**Retry After:** ${error.data.retryAfter} seconds`);
  }

  // Add auth URL for authentication errors
  if (error.data.authUrl) {
    parts.push(`**Authorization URL:** ${error.data.authUrl}`);
  }

  // Add recovery guidance
  if (!error.data.recoverable) {
    parts.push("*This error cannot be recovered by retrying.*");
  } else {
    parts.push("*This error may be resolved by retrying the operation.*");
  }

  // Add context information for debugging (if available)
  if (error.data.context?.tool) {
    parts.push(`\n*Tool:* \`${error.data.context.tool}\``);
  }

  if (error.data.context?.requestId) {
    parts.push(`*Request ID:* \`${error.data.context.requestId}\``);
  }

  return parts.join("\n\n");
}

/**
 * Format error for logging
 *
 * Creates a structured log entry suitable for stderr logging.
 * Omits sensitive information like tokens or PII.
 *
 * @param error - The normalized MCP error
 * @returns Structured log object
 *
 * @example
 * ```typescript
 * const logEntry = formatErrorForLogging(mcpError);
 * console.error(JSON.stringify(logEntry));
 * ```
 */
export function formatErrorForLogging(error: MCPError): object {
  return {
    level: "error",
    code: error.code,
    message: error.message,
    tool: error.data.context?.tool,
    requestId: error.data.context?.requestId,
    accountId: error.data.context?.accountId
      ? maskAccountId(error.data.context.accountId as string)
      : undefined,
    recoverable: error.data.recoverable,
    freshbooksCode: error.data.freshbooksError?.code,
    freshbooksErrno: error.data.freshbooksError?.errno,
    field: error.data.freshbooksError?.field,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Format error details for debugging
 *
 * Creates a comprehensive error dump including all details
 * for debugging purposes. In production, returns limited information
 * to prevent information disclosure.
 *
 * @param error - The normalized MCP error
 * @returns Detailed error information (limited in production)
 */
export function formatErrorForDebug(error: MCPError): object {
  // In production, return limited info to prevent information disclosure
  if (isProduction()) {
    return {
      mcpError: {
        code: error.code,
        message: error.message,
      },
      data: {
        recoverable: error.data.recoverable,
        suggestion: error.data.suggestion,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Full debug info only in non-production environments
  return {
    mcpError: {
      code: error.code,
      message: error.message,
      name: error.name,
      stack: error.stack,
    },
    data: error.data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get error summary
 *
 * Returns a brief one-line summary of the error.
 *
 * @param error - The normalized MCP error
 * @returns Brief error summary
 */
export function getErrorSummary(error: MCPError): string {
  const parts = [error.message];

  if (error.data.freshbooksError?.field) {
    parts.push(`(field: ${error.data.freshbooksError.field})`);
  }

  if (error.data.context?.tool) {
    parts.push(`[${error.data.context.tool}]`);
  }

  return parts.join(" ");
}

/**
 * Check if error is retryable
 *
 * Determines if the error can be resolved by retrying.
 *
 * @param error - The normalized MCP error
 * @returns True if error is retryable
 */
export function isRetryable(error: MCPError): boolean {
  return error.data.recoverable;
}

/**
 * Get suggested retry delay
 *
 * Returns the suggested delay before retrying (in milliseconds).
 *
 * @param error - The normalized MCP error
 * @returns Delay in milliseconds, or undefined if not retryable
 */
export function getRetryDelay(error: MCPError): number | undefined {
  if (!error.data.recoverable) {
    return undefined;
  }

  // If explicit retry-after is provided (in seconds), convert to ms
  if (error.data.retryAfter) {
    return error.data.retryAfter * 1000;
  }

  // Default retry delays based on error type
  switch (error.code) {
    case -32004: // RATE_LIMITED
      return 60000; // 60 seconds
    case -32008: // SERVICE_UNAVAILABLE
      return 30000; // 30 seconds
    case -32603: // INTERNAL_ERROR
      return 5000; // 5 seconds
    default:
      return 1000; // 1 second
  }
}

/**
 * Mask account ID for logging
 *
 * Masks the account ID to prevent logging full account identifiers.
 * Shows first 3 and last 3 characters only.
 *
 * @param accountId - Account ID to mask
 * @returns Masked account ID
 */
function maskAccountId(accountId: string): string {
  if (accountId.length <= 6) {
    return "***";
  }
  const start = accountId.substring(0, 3);
  const end = accountId.substring(accountId.length - 3);
  return `${start}...${end}`;
}
