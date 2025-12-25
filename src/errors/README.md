# Error Handling System

Comprehensive error normalization for the FreshBooks MCP server. All errors are converted to MCP JSON-RPC format while preserving original FreshBooks error details for debugging.

## Architecture

The error system provides:

1. **Dual-Format Errors**: All errors normalized to MCP format for clients, with original FreshBooks errors preserved in `data.freshbooksError`
2. **Type Safety**: Full TypeScript types for all error structures
3. **Recovery Guidance**: Every error includes actionable suggestions
4. **Context Preservation**: Errors include tool name, account ID, request ID, and other debugging context
5. **Automatic Mapping**: FreshBooks, OAuth, validation, and network errors are automatically mapped

## File Structure

```
src/errors/
├── types.ts              # Error type definitions
├── error-mapper.ts       # Error mapping logic
├── error-handler.ts      # Error handling utilities
├── index.ts              # Public exports
└── README.md             # This file
```

## MCP Error Format

All errors follow the JSON-RPC 2.0 error structure:

```typescript
{
  code: -32005,  // MCP error code
  message: "Resource not found: TimeEntry with id 99999 was not found",
  data: {
    // Original FreshBooks error (preserved for debugging)
    freshbooksError: {
      code: "NOT_FOUND",
      message: "TimeEntry with id 99999 was not found",
      errno: 1012,
      statusCode: 404
    },

    // Context about where the error occurred
    context: {
      tool: "timeentry_single",
      accountId: "ABC123",
      entityId: 99999,
      requestId: "req_abc123"
    },

    // Recovery guidance
    recoverable: false,
    suggestion: "Verify the time entry ID is correct. The entry may have been deleted.",

    // Rate limiting (if applicable)
    retryAfter: 60  // seconds
  }
}
```

## Error Codes

### JSON-RPC Standard Codes

| Code | Name | Description |
|------|------|-------------|
| -32700 | PARSE_ERROR | Invalid JSON received |
| -32600 | INVALID_REQUEST | Request is not valid JSON-RPC |
| -32601 | METHOD_NOT_FOUND | Tool does not exist |
| -32602 | INVALID_PARAMS | Invalid parameters |
| -32603 | INTERNAL_ERROR | Internal server error |

### Custom Application Codes (-32000 to -32099)

| Code | Name | Description | Recoverable |
|------|------|-------------|-------------|
| -32001 | NOT_AUTHENTICATED | No valid authentication | Yes |
| -32002 | TOKEN_EXPIRED | Access token expired | Yes |
| -32003 | PERMISSION_DENIED | Insufficient permissions | No |
| -32004 | RATE_LIMITED | Rate limit exceeded | Yes |
| -32005 | RESOURCE_NOT_FOUND | Resource doesn't exist | No |
| -32006 | VALIDATION_ERROR | Input validation failed | Yes |
| -32007 | CONFLICT | Resource already exists | No |
| -32008 | SERVICE_UNAVAILABLE | FreshBooks unavailable | Yes |
| -32009 | NETWORK_ERROR | Network/transport error | Yes |
| -32010 | TIMEOUT | Request timed out | Yes |

## Usage

### Basic Error Handling

```typescript
import { ErrorHandler } from "./errors/index.js";

try {
  // Call FreshBooks API
  const result = await client.timeEntries.list(accountId);
} catch (error) {
  // Normalize to MCP error
  const mcpError = ErrorHandler.normalizeError(error, {
    tool: "timeentry_list",
    accountId,
    requestId: "req_123"
  });

  throw mcpError;
}
```

### Tool Handler Wrapper

The recommended approach is to wrap tool handlers:

```typescript
import { ErrorHandler } from "./errors/index.js";

const handler = ErrorHandler.wrapHandler(
  "timeentry_create",
  async (input, context) => {
    // Your tool implementation
    // Errors are automatically normalized
    return result;
  }
);
```

### Creating Errors Directly

```typescript
import { ErrorHandler } from "./errors/index.js";

// Validation error
throw ErrorHandler.createValidationError(
  "Invalid date format",
  { tool: "timeentry_create" }
);

// Authentication error
throw ErrorHandler.createAuthError(
  "Token expired",
  { tool: "timeentry_list" }
);

// Not found error
throw ErrorHandler.createNotFoundError(
  "TimeEntry",
  12345,
  { tool: "timeentry_single" }
);
```

## Error Mapping

### FreshBooks Errors

FreshBooks error codes are automatically mapped:

| FreshBooks Code | MCP Code | Suggestion |
|----------------|----------|------------|
| UNAUTHORIZED | NOT_AUTHENTICATED | Authenticate using auth_get_url |
| TOKEN_EXPIRED | TOKEN_EXPIRED | Call auth_refresh or re-authenticate |
| FORBIDDEN | PERMISSION_DENIED | Contact administrator for access |
| NOT_FOUND | RESOURCE_NOT_FOUND | Verify ID, resource may be deleted |
| VALIDATION_ERROR | VALIDATION_ERROR | Check field values |
| RATE_LIMIT_EXCEEDED | RATE_LIMITED | Wait before retrying |
| CONFLICT | CONFLICT | Update instead of create |
| INTERNAL_ERROR | INTERNAL_ERROR | FreshBooks server error, try again |
| SERVICE_UNAVAILABLE | SERVICE_UNAVAILABLE | FreshBooks maintenance |

### Validation Errors (Zod)

Zod validation errors are mapped to `INVALID_PARAMS` with detailed validation issues:

```typescript
{
  code: -32602,
  message: 'Validation failed for "startedAt": Required',
  data: {
    validationErrors: [
      {
        path: "startedAt",
        message: "Required",
        code: "invalid_type",
        expected: "date",
        received: "undefined"
      }
    ],
    suggestion: 'Fix the "startedAt" field: required'
  }
}
```

### OAuth Errors

OAuth errors are mapped based on the error code:

- `invalid_grant`, `token_expired` → TOKEN_EXPIRED
- `invalid_client`, `unauthorized_client`, `access_denied` → NOT_AUTHENTICATED

### Network Errors

Network errors are detected by message patterns:

- `ETIMEDOUT`, `timeout` → TIMEOUT
- `ECONNREFUSED`, `ENOTFOUND` → SERVICE_UNAVAILABLE
- `ECONNRESET`, `socket hang up` → NETWORK_ERROR

## Error Context

All errors can include context for debugging:

```typescript
interface ErrorContext {
  tool?: string;          // Tool being executed
  accountId?: string;     // FreshBooks account ID
  entityId?: number | string;  // Entity being operated on
  requestId?: string;     // Request tracking ID
  operation?: string;     // Operation being performed
  [key: string]: unknown; // Additional custom context
}
```

## Recovery Guidance

Each error includes:

1. **recoverable**: Boolean indicating if retrying might succeed
2. **suggestion**: Human-readable guidance on how to fix the error
3. **retryAfter**: Seconds to wait before retrying (for rate limiting)

Examples:

```typescript
// Recoverable error
{
  recoverable: true,
  suggestion: "Call auth_refresh to get a new token"
}

// Non-recoverable error
{
  recoverable: false,
  suggestion: "Verify the ID is correct. The resource may have been deleted."
}

// Rate limited
{
  recoverable: true,
  suggestion: "Wait before making more requests",
  retryAfter: 60
}
```

## Type Guards

Use type guards to check error types:

```typescript
import { isMCPError, isFreshBooksError, isOAuthError, isNetworkError } from "./errors/index.js";

if (isMCPError(error)) {
  console.log("Already normalized:", error.code);
}

if (isFreshBooksError(error)) {
  console.log("FreshBooks error:", error.error.code);
}

if (isOAuthError(error)) {
  console.log("OAuth error:", error.code);
}

if (isNetworkError(error)) {
  console.log("Network error:", error.message);
}
```

## Best Practices

1. **Always Normalize**: Use `ErrorHandler.normalizeError()` or `ErrorHandler.wrapHandler()` for all errors
2. **Preserve Context**: Include tool name, account ID, and request ID in error context
3. **Never Log Tokens**: Sensitive data should never be logged or included in errors
4. **Use Type Guards**: Check error types before accessing properties
5. **Provide Suggestions**: Always include actionable recovery suggestions
6. **Test Error Paths**: Test both success and error scenarios for all tools

## Testing

Example error handling test:

```typescript
import { ErrorHandler, MCPErrorCode } from "../errors/index.js";

test("handles FreshBooks not found error", () => {
  const fbError = {
    ok: false,
    error: {
      code: "NOT_FOUND",
      message: "TimeEntry not found",
      errno: 1012
    },
    statusCode: 404
  };

  const mcpError = ErrorHandler.normalizeError(fbError, {
    tool: "timeentry_single",
    entityId: 99999
  });

  expect(mcpError.code).toBe(MCPErrorCode.RESOURCE_NOT_FOUND);
  expect(mcpError.message).toContain("not found");
  expect(mcpError.data.recoverable).toBe(false);
  expect(mcpError.data.suggestion).toBeDefined();
  expect(mcpError.data.freshbooksError?.code).toBe("NOT_FOUND");
});
```

## Examples

### Complete Tool Implementation

```typescript
import { ErrorHandler, ToolContext } from "./errors/index.js";
import { z } from "zod";

// Input schema
const inputSchema = z.object({
  accountId: z.string(),
  timeEntryId: z.number()
});

// Wrapped handler with automatic error normalization
const handler = ErrorHandler.wrapHandler(
  "timeentry_single",
  async (input: unknown, context: ToolContext) => {
    // Validate input (automatically catches Zod errors)
    const { accountId, timeEntryId } = inputSchema.parse(input);

    // Call FreshBooks API (automatically catches API errors)
    const response = await client.timeEntries.single(accountId, timeEntryId);

    if (!response.ok) {
      throw response; // Will be normalized to MCPError
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify(response.data, null, 2)
      }]
    };
  }
);
```

## Error Flow

```
1. Error occurs (FreshBooks API, validation, network, etc.)
   ↓
2. ErrorHandler.normalizeError() detects error type
   ↓
3. ErrorMapper maps to appropriate MCP error code
   ↓
4. Original error preserved in data.freshbooksError
   ↓
5. Context added (tool, accountId, requestId, etc.)
   ↓
6. Recovery suggestion generated
   ↓
7. MCPError thrown/returned
   ↓
8. MCP server serializes to JSON-RPC error response
   ↓
9. Claude receives structured error with recovery guidance
```

## Summary

The error handling system provides:

- ✅ Consistent error format across all tools
- ✅ Preservation of original error details
- ✅ Type-safe error handling
- ✅ Automatic error mapping
- ✅ Recovery guidance for Claude
- ✅ Debugging context
- ✅ No sensitive data leakage
