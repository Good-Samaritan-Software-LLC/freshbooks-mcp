/**
 * Error Handler
 *
 * Provides reusable error handling utilities including:
 * - Tool handler wrapper with automatic error normalization
 * - Generic error normalization
 * - Error type detection
 */

import { z } from "zod";
import {
  MCPError,
  MCPErrorCode,
  FreshBooksApiError,
  OAuthError,
  ErrorContext,
  ToolContext,
} from "./types.js";
import { ErrorMapper } from "./error-mapper.js";

/**
 * Error Handler Class
 *
 * Central error handling and normalization logic.
 */
export class ErrorHandler {
  /**
   * Wrap tool handler with error normalization
   *
   * This wrapper:
   * - Generates a request ID for tracking
   * - Logs the tool invocation
   * - Catches and normalizes all errors
   * - Logs normalized errors
   *
   * @param toolName - Name of the tool being wrapped
   * @param handler - The actual tool handler function
   * @returns Wrapped handler with error normalization
   *
   * @example
   * ```typescript
   * const wrappedHandler = ErrorHandler.wrapHandler(
   *   "timeentry_create",
   *   async (input, context) => {
   *     // Tool implementation
   *     return result;
   *   }
   * );
   * ```
   */
  static wrapHandler<TInput, TOutput>(
    toolName: string,
    handler: (input: TInput, context: ToolContext) => Promise<TOutput>
  ): (input: TInput, context: ToolContext) => Promise<TOutput> {
    return async (input: TInput, context: ToolContext): Promise<TOutput> => {
      const requestId = generateRequestId();

      try {
        // Note: In production, this would use a proper logger
        // For now, we avoid logging to keep stdio clean for MCP
        const result = await handler(input, context);
        return result;
      } catch (error) {
        const errorContext: ErrorContext = {
          tool: toolName,
          requestId,
        };

        if (context.accountId !== undefined) {
          errorContext.accountId = context.accountId;
        }

        const mcpError = this.normalizeError(error, errorContext);

        // Re-throw the normalized error
        throw mcpError;
      }
    };
  }

  /**
   * Normalize any error to MCP format
   *
   * Detects the error type and maps it appropriately:
   * - Already normalized MCPError: return as-is
   * - FreshBooks API error: map using ErrorMapper
   * - Zod validation error: map validation issues
   * - OAuth error: map authentication error
   * - Network error: map network/transport error
   * - Unknown error: create generic internal error
   *
   * @param error - Error to normalize
   * @param context - Additional context
   * @returns Normalized MCP error
   */
  static normalizeError(error: unknown, context?: ErrorContext): MCPError {
    // Already normalized
    if (this.isMCPError(error)) {
      // Add context if provided and not already present
      if (context && !error.data.context) {
        error.data.context = context;
      }
      return error;
    }

    // FreshBooks API error
    if (this.isFreshBooksError(error)) {
      return ErrorMapper.mapFreshBooksError(error, context);
    }

    // Zod validation error
    if (error instanceof z.ZodError) {
      return ErrorMapper.mapValidationError(error, context);
    }

    // OAuth error
    if (error instanceof OAuthError) {
      return ErrorMapper.mapOAuthError(error, context);
    }

    // Network error
    if (error instanceof Error && this.isNetworkError(error)) {
      return ErrorMapper.mapNetworkError(error, context);
    }

    // HTTP-like error with status code
    if (this.isHttpError(error)) {
      return ErrorMapper.mapHttpError(
        error.statusCode,
        error.statusText || "Unknown",
        context
      );
    }

    // Unknown error - create generic internal error
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    const errorData: MCPError['data'] = {
      recoverable: true,
      suggestion: "An unexpected error occurred. Please try again.",
    };

    if (context) {
      errorData.context = context;
    }

    if (stack) {
      errorData.freshbooksError = {
        code: "UNKNOWN_ERROR",
        message,
        details: { stack },
      };
    }

    const mcpError: MCPError = Object.assign(
      new Error(`Unexpected error: ${message}`),
      {
        code: MCPErrorCode.INTERNAL_ERROR,
        message: `Unexpected error: ${message}`,
        data: errorData,
      }
    );

    return mcpError;
  }

  /**
   * Check if error is already an MCPError
   */
  private static isMCPError(error: unknown): error is MCPError {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      "message" in error &&
      "data" in error &&
      typeof (error as MCPError).code === "number" &&
      (error as MCPError).code < -32000 &&
      "recoverable" in (error as MCPError).data
    );
  }

  /**
   * Check if error is a FreshBooks API error
   */
  private static isFreshBooksError(
    error: unknown
  ): error is FreshBooksApiError {
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
   * Check if error is a network/transport error
   */
  private static isNetworkError(error: Error): boolean {
    const networkIndicators = [
      "ETIMEDOUT",
      "ECONNREFUSED",
      "ENOTFOUND",
      "ECONNRESET",
      "EAI_AGAIN",
      "ENOTFOUND",
      "socket hang up",
      "network",
      "fetch failed",
      "getaddrinfo",
    ];

    const message = error.message.toLowerCase();
    return networkIndicators.some((indicator) =>
      message.includes(indicator.toLowerCase())
    );
  }

  /**
   * Check if error has HTTP status code
   */
  private static isHttpError(
    error: unknown
  ): error is { statusCode: number; statusText?: string } {
    return (
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof (error as { statusCode: number }).statusCode === "number"
    );
  }

  /**
   * Create a validation error
   *
   * Helper method for creating validation errors directly.
   *
   * @param message - Error message
   * @param context - Error context
   * @returns MCPError with validation error code
   */
  static createValidationError(
    message: string,
    context?: ErrorContext
  ): MCPError {
    const errorData: MCPError['data'] = {
      recoverable: true,
      suggestion: "Check the input parameters and try again",
    };

    if (context) {
      errorData.context = context;
    }

    return Object.assign(new Error(message), {
      code: MCPErrorCode.INVALID_PARAMS,
      message,
      data: errorData,
    });
  }

  /**
   * Create an authentication error
   *
   * Helper method for creating authentication errors directly.
   *
   * @param message - Error message
   * @param context - Error context
   * @returns MCPError with authentication error code
   */
  static createAuthError(message: string, context?: ErrorContext): MCPError {
    const errorData: MCPError['data'] = {
      recoverable: true,
      suggestion: "Please re-authenticate using auth_get_url",
    };

    if (context) {
      errorData.context = context;
    }

    return Object.assign(new Error(message), {
      code: MCPErrorCode.NOT_AUTHENTICATED,
      message,
      data: errorData,
    });
  }

  /**
   * Create a not found error
   *
   * Helper method for creating not found errors directly.
   *
   * @param resourceType - Type of resource (e.g., "TimeEntry")
   * @param resourceId - ID of the resource
   * @param context - Error context
   * @returns MCPError with not found error code
   */
  static createNotFoundError(
    resourceType: string,
    resourceId: string | number,
    context?: ErrorContext
  ): MCPError {
    const message = `${resourceType} with id ${resourceId} was not found`;

    const errorData: MCPError['data'] = {
      recoverable: false,
      suggestion: `Verify the ${resourceType} ID is correct. The resource may have been deleted.`,
    };

    if (context) {
      errorData.context = context;
    }

    return Object.assign(new Error(message), {
      code: MCPErrorCode.RESOURCE_NOT_FOUND,
      message,
      data: errorData,
    });
  }
}

/**
 * Generate a unique request ID
 *
 * Used for tracking requests through logs.
 *
 * @returns Request ID in format: req_<timestamp>_<random>
 */
function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
}

/**
 * Export request ID generator for use in other modules
 */
export { generateRequestId };

/**
 * Convenience function for normalizing errors
 * Re-exports ErrorHandler.normalizeError as handleError for backward compatibility
 */
export const handleError = ErrorHandler.normalizeError.bind(ErrorHandler);

/**
 * Convenience function for creating authentication errors
 * Re-exports ErrorHandler.createAuthError for backward compatibility
 */
export const createAuthError = ErrorHandler.createAuthError.bind(ErrorHandler);
