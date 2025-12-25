/**
 * Error Documentation
 *
 * Comprehensive documentation for all MCP error codes including:
 * - Description of what the error means
 * - Common causes
 * - Recommended solutions
 * - Examples
 */

import { MCPErrorCode } from "./types.js";

/**
 * Error Documentation Entry
 */
export interface ErrorDocumentation {
  name: string;
  description: string;
  causes: string[];
  solutions: string[];
  examples?: string[];
}

/**
 * Complete error documentation map
 */
export const ERROR_DOCUMENTATION: Record<MCPErrorCode, ErrorDocumentation> = {
  // Standard JSON-RPC 2.0 Errors
  [MCPErrorCode.PARSE_ERROR]: {
    name: "Parse Error",
    description: "Invalid JSON was received by the server",
    causes: [
      "Malformed JSON in request",
      "Invalid character encoding",
      "Incomplete JSON structure",
    ],
    solutions: [
      "Verify the request is valid JSON",
      "Check for proper escaping of special characters",
      "Ensure complete JSON structure with matching braces",
    ],
    examples: [
      "Missing closing brace in JSON object",
      "Unescaped quotes in string values",
    ],
  },

  [MCPErrorCode.INVALID_REQUEST]: {
    name: "Invalid Request",
    description: "The JSON sent is not a valid Request object",
    causes: [
      "Missing required fields (jsonrpc, method)",
      "Invalid jsonrpc version",
      "Invalid method name format",
    ],
    solutions: [
      "Include 'jsonrpc': '2.0' in request",
      "Provide valid 'method' field",
      "Ensure request structure matches JSON-RPC 2.0 spec",
    ],
    examples: [
      "Request missing 'method' field",
      "jsonrpc field set to '1.0' instead of '2.0'",
    ],
  },

  [MCPErrorCode.METHOD_NOT_FOUND]: {
    name: "Method Not Found",
    description: "The requested method does not exist or is not available",
    causes: [
      "Misspelled tool name",
      "Tool not registered",
      "Tool disabled or deprecated",
    ],
    solutions: [
      "Check the tool name spelling",
      "List available tools to verify the tool exists",
      "Update to use the current tool name if deprecated",
    ],
    examples: [
      "Called 'timeentry_creates' instead of 'timeentry_create'",
      "Attempting to use a deprecated tool",
    ],
  },

  [MCPErrorCode.INVALID_PARAMS]: {
    name: "Invalid Parameters",
    description: "Invalid method parameters provided",
    causes: [
      "Missing required parameters",
      "Invalid parameter types",
      "Parameters outside valid ranges",
      "Malformed parameter structure",
    ],
    solutions: [
      "Check all required parameters are provided",
      "Verify parameter types match the schema",
      "Ensure values are within valid ranges",
      "Review parameter format requirements",
    ],
    examples: [
      "Missing required 'account_id' parameter",
      "Provided string instead of number for 'duration'",
      "Date in wrong format (use ISO 8601)",
    ],
  },

  [MCPErrorCode.INTERNAL_ERROR]: {
    name: "Internal Error",
    description: "Internal server error occurred",
    causes: [
      "Unexpected exception in server code",
      "Unhandled error condition",
      "System resource issues",
    ],
    solutions: [
      "Retry the operation",
      "Check server logs for details",
      "Report the issue if it persists",
    ],
    examples: [
      "Unexpected null pointer",
      "Database connection failed",
    ],
  },

  // Custom Application Errors
  [MCPErrorCode.NOT_AUTHENTICATED]: {
    name: "Not Authenticated",
    description: "No valid authentication found or session expired",
    causes: [
      "Never authenticated with FreshBooks",
      "Access token expired (typically after 12 hours)",
      "Tokens were revoked by user",
      "Invalid or corrupted token storage",
    ],
    solutions: [
      "Call auth_get_url to start authentication flow",
      "Visit the authorization URL and approve access",
      "Exchange the authorization code using auth_exchange_code",
      "Call auth_refresh if you have a valid refresh token",
    ],
    examples: [
      "First time using the server - need to authenticate",
      "Access token expired after 12 hours",
      "User revoked access in FreshBooks settings",
    ],
  },

  [MCPErrorCode.TOKEN_EXPIRED]: {
    name: "Token Expired",
    description: "The access token has expired and needs to be refreshed",
    causes: [
      "Token lifetime exceeded (usually 12 hours for FreshBooks)",
      "Server clock skew",
      "Server invalidated the token",
    ],
    solutions: [
      "Call auth_refresh to get a new access token",
      "Re-authenticate if refresh fails",
      "Check system clock is accurate",
    ],
    examples: [
      "Token issued 13 hours ago",
      "Token manually invalidated by FreshBooks",
    ],
  },

  [MCPErrorCode.PERMISSION_DENIED]: {
    name: "Permission Denied",
    description: "You don't have permission to access this resource",
    causes: [
      "Insufficient role/permissions in FreshBooks account",
      "Resource belongs to another account",
      "Feature not enabled for your FreshBooks plan",
      "Attempting to modify read-only resource",
    ],
    solutions: [
      "Verify you're using the correct account",
      "Contact your FreshBooks administrator for access",
      "Upgrade your FreshBooks plan if needed",
      "Check the resource belongs to your account",
    ],
    examples: [
      "Regular user trying to delete someone else's time entry",
      "Accessing feature not included in current plan",
      "Trying to modify archived/locked resource",
    ],
  },

  [MCPErrorCode.RATE_LIMITED]: {
    name: "Rate Limited",
    description: "Too many requests in a short period",
    causes: [
      "Exceeded API rate limits (varies by endpoint)",
      "Burst of requests sent too quickly",
      "Shared IP address limit reached",
    ],
    solutions: [
      "Wait before making more requests (check retryAfter)",
      "Implement exponential backoff for retries",
      "Reduce request frequency",
      "Batch operations when possible",
    ],
    examples: [
      "Sent 100 requests in 1 second",
      "Multiple users on same IP hitting limits",
    ],
  },

  [MCPErrorCode.RESOURCE_NOT_FOUND]: {
    name: "Resource Not Found",
    description: "The requested resource doesn't exist",
    causes: [
      "Invalid ID provided",
      "Resource was deleted",
      "Resource is in a different account",
      "Typo in resource identifier",
    ],
    solutions: [
      "Verify the ID is correct",
      "List resources to find valid IDs",
      "Check you're using the correct account",
      "Confirm resource wasn't deleted",
    ],
    examples: [
      "TimeEntry with id 99999 not found",
      "Project deleted before update attempted",
      "Looking for resource in wrong account",
    ],
  },

  [MCPErrorCode.VALIDATION_ERROR]: {
    name: "Validation Error",
    description: "The input data failed validation",
    causes: [
      "Missing required fields",
      "Invalid field values",
      "Format errors (dates, emails, numbers)",
      "Business rule violations",
      "Field value out of acceptable range",
    ],
    solutions: [
      "Check all required fields are provided",
      "Verify field formats (dates in ISO 8601, etc.)",
      "Review validation error details for specific field",
      "Ensure values meet business rules",
    ],
    examples: [
      "Missing required 'description' field",
      "Date format is MM/DD/YYYY instead of ISO 8601",
      "Duration is negative",
      "Email address format invalid",
    ],
  },

  [MCPErrorCode.CONFLICT]: {
    name: "Conflict",
    description: "The operation conflicts with existing data",
    causes: [
      "Duplicate entry (unique constraint violation)",
      "Concurrent modification detected",
      "Business rule violation",
      "Resource state incompatible with operation",
    ],
    solutions: [
      "Check for existing similar resources",
      "Use update instead of create",
      "Resolve the conflict manually",
      "Fetch latest version and retry",
    ],
    examples: [
      "Client with same email already exists",
      "Invoice number already used",
      "Resource modified by another user",
      "Trying to delete resource with dependencies",
    ],
  },

  [MCPErrorCode.SERVICE_UNAVAILABLE]: {
    name: "Service Unavailable",
    description: "The FreshBooks service is temporarily unavailable",
    causes: [
      "FreshBooks API is down for maintenance",
      "Network connectivity issues",
      "Request timeout",
      "Service overloaded",
    ],
    solutions: [
      "Wait and retry the operation",
      "Check FreshBooks status page",
      "Verify internet connection",
      "Implement exponential backoff",
    ],
    examples: [
      "Scheduled maintenance window",
      "Network timeout after 30 seconds",
      "FreshBooks experiencing high load",
    ],
  },

  [MCPErrorCode.NETWORK_ERROR]: {
    name: "Network Error",
    description: "A network communication error occurred",
    causes: [
      "No internet connection",
      "DNS resolution failed",
      "Connection refused by server",
      "Network unreachable",
    ],
    solutions: [
      "Check your internet connection",
      "Verify DNS settings",
      "Try again later",
      "Check if FreshBooks is accessible from your network",
    ],
    examples: [
      "ECONNREFUSED when server is down",
      "ENOTFOUND for DNS issues",
      "ENETUNREACH for network problems",
    ],
  },

  [MCPErrorCode.TIMEOUT]: {
    name: "Timeout",
    description: "The request timed out before receiving a response",
    causes: [
      "Server took too long to respond",
      "Network latency issues",
      "Large request payload",
      "Server under heavy load",
    ],
    solutions: [
      "Retry the request",
      "Check network connectivity",
      "Try with smaller request payload",
      "Wait and try again later",
    ],
    examples: [
      "Request exceeded 30 second timeout",
      "Connection established but response never received",
    ],
  },
};

/**
 * Get documentation for an error code
 *
 * @param code - MCP error code
 * @returns Documentation for the error, or undefined if not found
 */
export function getErrorDocumentation(
  code: MCPErrorCode
): ErrorDocumentation | undefined {
  return ERROR_DOCUMENTATION[code];
}

/**
 * Get all error codes and their documentation
 *
 * @returns Map of all error codes to their documentation
 */
export function getAllErrorDocumentation(): Record<
  MCPErrorCode,
  ErrorDocumentation
> {
  return ERROR_DOCUMENTATION;
}

/**
 * Search error documentation
 *
 * Search for errors by name, description, or causes.
 *
 * @param query - Search query
 * @returns Matching error codes and documentation
 */
export function searchErrorDocumentation(
  query: string
): Array<{ code: MCPErrorCode; documentation: ErrorDocumentation }> {
  const results: Array<{
    code: MCPErrorCode;
    documentation: ErrorDocumentation;
  }> = [];
  const lowerQuery = query.toLowerCase();

  for (const [codeStr, doc] of Object.entries(ERROR_DOCUMENTATION)) {
    const code = parseInt(codeStr) as MCPErrorCode;

    // Search in name, description, causes, and solutions
    const searchText = [
      doc.name,
      doc.description,
      ...doc.causes,
      ...doc.solutions,
    ]
      .join(" ")
      .toLowerCase();

    if (searchText.includes(lowerQuery)) {
      results.push({ code, documentation: doc });
    }
  }

  return results;
}

/**
 * Format error documentation as markdown
 *
 * @param code - MCP error code
 * @returns Markdown formatted documentation
 */
export function formatErrorDocumentation(code: MCPErrorCode): string {
  const doc = ERROR_DOCUMENTATION[code];
  if (!doc) {
    return `No documentation available for error code ${code}`;
  }

  const parts = [
    `# ${doc.name} (${code})`,
    "",
    doc.description,
    "",
    "## Common Causes",
    ...doc.causes.map((cause) => `- ${cause}`),
    "",
    "## Solutions",
    ...doc.solutions.map((solution) => `- ${solution}`),
  ];

  if (doc.examples && doc.examples.length > 0) {
    parts.push("", "## Examples", ...doc.examples.map((ex) => `- ${ex}`));
  }

  return parts.join("\n");
}
