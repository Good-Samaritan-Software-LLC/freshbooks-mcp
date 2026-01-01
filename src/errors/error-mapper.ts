/**
 * Error Mapper
 *
 * Maps various error types to normalized MCP format while
 * preserving original error details for debugging.
 */

import { z } from "zod";
import {
  MCPError,
  MCPErrorCode,
  MCPErrorData,
  FreshBooksErrorCode,
  FreshBooksApiError,
  ErrorMapping,
  ErrorContext,
  OAuthError,
} from "./types.js";

/**
 * Error Mapper Class
 *
 * Provides static methods for mapping different error types
 * to the normalized MCP error format.
 */
export class ErrorMapper {
  /**
   * Map FreshBooks API error to MCP error
   *
   * @param fbError - FreshBooks API error object
   * @param context - Additional error context
   * @returns Normalized MCP error
   */
  static mapFreshBooksError(
    fbError: FreshBooksApiError,
    context?: ErrorContext
  ): MCPError {
    const errorCode = fbError.error?.code || "UNKNOWN";
    const mapping = ERROR_MAPPINGS[errorCode] || DEFAULT_MAPPING;

    const mcpError: MCPError = Object.assign(
      new Error(mapping.getMessage(fbError.error)),
      {
        code: mapping.mcpCode,
        message: mapping.getMessage(fbError.error),
        data: {
          freshbooksError: {
            code: fbError.error?.code || "UNKNOWN",
            message: fbError.error?.message || "Unknown error",
            field: fbError.error?.field,
            errno: fbError.error?.errno,
            details: fbError.error?.details,
          },
          context,
          recoverable: mapping.recoverable,
          suggestion: mapping.getSuggestion(fbError.error),
          retryAfter: fbError.retryAfter,
        } as MCPErrorData,
      }
    );

    return mcpError;
  }

  /**
   * Map Zod validation error to MCP error
   *
   * @param zodError - Zod validation error
   * @param context - Additional error context
   * @returns Normalized MCP error
   */
  static mapValidationError(
    zodError: z.ZodError,
    context?: ErrorContext
  ): MCPError {
    const issues = zodError.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
      code: issue.code,
      expected: "expected" in issue ? String(issue.expected) : undefined,
      received: "received" in issue ? issue.received : undefined,
    }));

    const firstIssue = issues[0];
    const message = firstIssue
      ? `Validation failed for "${firstIssue.path}": ${firstIssue.message}`
      : "Validation failed";

    const mcpError: MCPError = Object.assign(new Error(message), {
      code: MCPErrorCode.INVALID_PARAMS,
      message,
      data: {
        validationErrors: issues,
        context,
        recoverable: true,
        suggestion: this.getValidationSuggestion(issues),
        statusCode: 400,
      } as MCPErrorData,
    });

    return mcpError;
  }

  /**
   * Map OAuth error to MCP error
   *
   * @param error - OAuth error
   * @param context - Additional error context
   * @returns Normalized MCP error
   */
  static mapOAuthError(error: OAuthError, context?: ErrorContext): MCPError {
    const isTokenExpired =
      error.code === "invalid_grant" ||
      error.code === "token_expired" ||
      error.message.toLowerCase().includes("expired");

    const isInvalidAuth =
      error.code === "invalid_client" ||
      error.code === "unauthorized_client" ||
      error.code === "access_denied";

    if (isTokenExpired) {
      const message = "Authentication token has expired.";
      return Object.assign(new Error(message), {
        code: MCPErrorCode.TOKEN_EXPIRED,
        message,
        data: {
          freshbooksError: {
            code: error.code,
            message: error.message,
          },
          context,
          recoverable: true,
          suggestion:
            "Call auth_refresh to get a new token, or re-authenticate using auth_get_url",
        } as MCPErrorData,
      });
    }

    if (isInvalidAuth) {
      const message = "Authentication failed or access was denied.";
      return Object.assign(new Error(message), {
        code: MCPErrorCode.NOT_AUTHENTICATED,
        message,
        data: {
          freshbooksError: {
            code: error.code,
            message: error.message,
          },
          context,
          recoverable: true,
          suggestion:
            "Re-authenticate using auth_get_url to obtain valid credentials",
        } as MCPErrorData,
      });
    }

    const message = `OAuth error: ${error.message}`;
    return Object.assign(new Error(message), {
      code: MCPErrorCode.NOT_AUTHENTICATED,
      message,
      data: {
        freshbooksError: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        context,
        recoverable: true,
        suggestion: "Check your OAuth credentials and try again",
      } as MCPErrorData,
    });
  }

  /**
   * Get validation suggestion based on issues
   *
   * @param issues - Validation issues
   * @returns Human-readable suggestion
   */
  private static getValidationSuggestion(
    issues: Array<{ path: string; message: string }>
  ): string {
    if (issues.length === 0) {
      return "Check the input parameters and try again";
    }

    if (issues.length === 1) {
      const issue = issues[0];
      if (!issue) {
        return "Check the input parameters and try again";
      }
      return `Fix the "${issue.path}" field: ${issue.message.toLowerCase()}`;
    }

    const fields = issues.map((i) => `"${i.path}"`).join(", ");
    return `Fix the following fields: ${fields}`;
  }

  /**
   * Map network/transport error to MCP error
   *
   * Handles various network error conditions like timeouts,
   * connection failures, DNS errors, etc.
   *
   * @param error - Network error
   * @param context - Additional error context
   * @returns Normalized MCP error
   */
  static mapNetworkError(error: Error, context?: ErrorContext): MCPError {
    const errorMessage = error.message.toLowerCase();

    // Timeout errors
    const isTimeout =
      errorMessage.includes("etimedout") || errorMessage.includes("timeout");

    // Connection errors
    const isConnection =
      errorMessage.includes("econnrefused") ||
      errorMessage.includes("enotfound") ||
      errorMessage.includes("econnreset");

    // DNS errors
    const isDNS =
      errorMessage.includes("eai_again") ||
      errorMessage.includes("getaddrinfo");

    // Socket errors
    const isSocket = errorMessage.includes("socket hang up");

    if (isTimeout) {
      const message = "Request timed out. FreshBooks may be slow to respond.";
      return Object.assign(new Error(message), {
        code: MCPErrorCode.SERVICE_UNAVAILABLE,
        message,
        data: {
          context,
          recoverable: true,
          suggestion:
            "Wait a moment and try again. If the issue persists, check FreshBooks status.",
        } as MCPErrorData,
      });
    }

    if (isConnection || isDNS) {
      const message = "Could not connect to FreshBooks API.";
      return Object.assign(new Error(message), {
        code: MCPErrorCode.SERVICE_UNAVAILABLE,
        message,
        data: {
          context,
          recoverable: true,
          suggestion: "Check your internet connection and try again.",
        } as MCPErrorData,
      });
    }

    if (isSocket) {
      const message = "Connection was closed unexpectedly.";
      return Object.assign(new Error(message), {
        code: MCPErrorCode.SERVICE_UNAVAILABLE,
        message,
        data: {
          context,
          recoverable: true,
          suggestion:
            "The connection was interrupted. Please try again.",
        } as MCPErrorData,
      });
    }

    // Generic network error
    const message = `Network error: ${error.message}`;
    return Object.assign(new Error(message), {
      code: MCPErrorCode.INTERNAL_ERROR,
      message,
      data: {
        context,
        recoverable: true,
        suggestion: "An unexpected network error occurred. Please try again.",
      } as MCPErrorData,
    });
  }

  /**
   * Map HTTP status code to MCP error
   *
   * @param statusCode - HTTP status code
   * @param statusText - HTTP status text
   * @param context - Additional error context
   * @returns Normalized MCP error
   */
  static mapHttpError(
    statusCode: number,
    statusText: string,
    context?: ErrorContext
  ): MCPError {
    let code: MCPErrorCode;
    let message: string;
    let recoverable: boolean;
    let suggestion: string;

    switch (statusCode) {
      case 401:
        code = MCPErrorCode.NOT_AUTHENTICATED;
        message = "Authentication required or session expired";
        recoverable = true;
        suggestion = "Please re-authenticate using auth_get_url";
        break;

      case 403:
        code = MCPErrorCode.PERMISSION_DENIED;
        message = "Permission denied";
        recoverable = false;
        suggestion =
          "You don't have access to this resource. Contact your administrator.";
        break;

      case 404:
        code = MCPErrorCode.RESOURCE_NOT_FOUND;
        message = "Resource not found";
        recoverable = false;
        suggestion =
          "Verify the resource ID is correct. The resource may have been deleted.";
        break;

      case 409:
        code = MCPErrorCode.CONFLICT;
        message = "Conflict with existing resource";
        recoverable = false;
        suggestion = "A resource with these details already exists";
        break;

      case 422:
        code = MCPErrorCode.VALIDATION_ERROR;
        message = "Validation failed";
        recoverable = true;
        suggestion = "Check the input values and try again";
        break;

      case 429:
        code = MCPErrorCode.RATE_LIMITED;
        message = "Rate limit exceeded";
        recoverable = true;
        suggestion = "Wait a moment before making more requests";
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        code = MCPErrorCode.SERVICE_UNAVAILABLE;
        message = "FreshBooks service is unavailable";
        recoverable = true;
        suggestion =
          "An error occurred on FreshBooks' side. Please try again.";
        break;

      default:
        code = MCPErrorCode.INTERNAL_ERROR;
        message = `HTTP error ${statusCode}: ${statusText}`;
        recoverable = true;
        suggestion = "An unexpected error occurred. Please try again.";
    }

    return Object.assign(new Error(message), {
      code,
      message,
      data: {
        freshbooksError: {
          code: `HTTP_${statusCode}`,
          message: statusText,
        },
        context,
        recoverable,
        suggestion,
      } as MCPErrorData,
    });
  }
}

/**
 * Error Mapping Configuration
 *
 * Maps FreshBooks error codes to MCP error codes with
 * recovery guidance.
 */
const ERROR_MAPPINGS: Record<string, ErrorMapping> = {
  // Authentication Errors
  [FreshBooksErrorCode.UNAUTHORIZED]: {
    mcpCode: MCPErrorCode.NOT_AUTHENTICATED,
    recoverable: true,
    statusCode: 401,
    getMessage: () => "Authentication required or session expired",
    getSuggestion: () =>
      "Please authenticate using auth_get_url to obtain access credentials",
  },

  [FreshBooksErrorCode.UNAUTHENTICATED]: {
    mcpCode: MCPErrorCode.NOT_AUTHENTICATED,
    recoverable: true,
    statusCode: 401,
    getMessage: () => "No valid authentication found",
    getSuggestion: () =>
      "Call auth_get_url to start the authentication process",
  },

  [FreshBooksErrorCode.TOKEN_EXPIRED]: {
    mcpCode: MCPErrorCode.TOKEN_EXPIRED,
    recoverable: true,
    statusCode: 401,
    getMessage: () => "Access token has expired",
    getSuggestion: () =>
      "Call auth_refresh to refresh your token, or re-authenticate if refresh fails",
  },

  [FreshBooksErrorCode.INVALID_GRANT]: {
    mcpCode: MCPErrorCode.TOKEN_EXPIRED,
    recoverable: true,
    statusCode: 401,
    getMessage: () => "Refresh token is invalid or expired",
    getSuggestion: () =>
      "Re-authenticate using auth_get_url to obtain new credentials",
  },

  // Permission Errors
  [FreshBooksErrorCode.FORBIDDEN]: {
    mcpCode: MCPErrorCode.PERMISSION_DENIED,
    recoverable: false,
    statusCode: 403,
    getMessage: (e) => `Permission denied: ${e.message}`,
    getSuggestion: () =>
      "You don't have permission to access this resource. Contact your FreshBooks administrator to request access.",
  },

  [FreshBooksErrorCode.INSUFFICIENT_PERMISSIONS]: {
    mcpCode: MCPErrorCode.PERMISSION_DENIED,
    recoverable: false,
    statusCode: 403,
    getMessage: (e) => `Insufficient permissions: ${e.message}`,
    getSuggestion: () =>
      "Your FreshBooks account lacks the required permissions for this operation",
  },

  // Resource Errors
  [FreshBooksErrorCode.NOT_FOUND]: {
    mcpCode: MCPErrorCode.RESOURCE_NOT_FOUND,
    recoverable: false,
    statusCode: 404,
    getMessage: (e) => {
      if (e.field) {
        return `Resource not found: The ${e.field} you specified doesn't exist`;
      }
      return `Resource not found: ${e.message}`;
    },
    getSuggestion: (e) => {
      if (e.field) {
        return `Verify the ${e.field} is correct. The resource may have been deleted or moved to a different account.`;
      }
      return "Double-check the ID or identifier. The resource may have been deleted.";
    },
  },

  // Validation Errors
  [FreshBooksErrorCode.VALIDATION_ERROR]: {
    mcpCode: MCPErrorCode.VALIDATION_ERROR,
    recoverable: true,
    statusCode: 422,
    getMessage: (e) => {
      if (e.field) {
        return `Invalid value for "${e.field}": ${e.message}`;
      }
      return `Validation error: ${e.message}`;
    },
    getSuggestion: (e) => {
      if (e.field) {
        return `Check the value provided for "${e.field}" and ensure it meets the requirements`;
      }
      return "Review the input values and ensure they match the expected format";
    },
  },

  [FreshBooksErrorCode.BAD_REQUEST]: {
    mcpCode: MCPErrorCode.VALIDATION_ERROR,
    recoverable: true,
    statusCode: 400,
    getMessage: (e) => `Invalid request: ${e.message}`,
    getSuggestion: () =>
      "Check the request parameters and ensure all required fields are provided correctly",
  },

  // Rate Limiting
  [FreshBooksErrorCode.RATE_LIMIT_EXCEEDED]: {
    mcpCode: MCPErrorCode.RATE_LIMITED,
    recoverable: true,
    statusCode: 429,
    getMessage: () => "Rate limit exceeded",
    getSuggestion: () =>
      "You've made too many requests in a short period. Wait before making more requests.",
  },

  // Conflict Errors
  [FreshBooksErrorCode.CONFLICT]: {
    mcpCode: MCPErrorCode.CONFLICT,
    recoverable: false,
    statusCode: 409,
    getMessage: (e) => `Conflict: ${e.message}`,
    getSuggestion: () =>
      "A resource with these details already exists. Try updating the existing resource instead of creating a new one.",
  },

  // Server Errors
  [FreshBooksErrorCode.INTERNAL_ERROR]: {
    mcpCode: MCPErrorCode.INTERNAL_ERROR,
    recoverable: true,
    statusCode: 500,
    getMessage: () => "FreshBooks server error",
    getSuggestion: () =>
      "An error occurred on FreshBooks' side. Please try again in a few moments. If the issue persists, contact FreshBooks support.",
  },

  [FreshBooksErrorCode.SERVICE_UNAVAILABLE]: {
    mcpCode: MCPErrorCode.SERVICE_UNAVAILABLE,
    recoverable: true,
    statusCode: 503,
    getMessage: () => "FreshBooks service is temporarily unavailable",
    getSuggestion: () =>
      "FreshBooks may be undergoing maintenance. Please try again later or check status.freshbooks.com",
  },
};

/**
 * Default Error Mapping
 *
 * Used when no specific mapping is found for an error code.
 */
const DEFAULT_MAPPING: ErrorMapping = {
  mcpCode: MCPErrorCode.INTERNAL_ERROR,
  recoverable: true,
  getMessage: (e) => e.message || "An unexpected error occurred",
  getSuggestion: () =>
    "Please try again. If the issue persists, check the error details.",
};
