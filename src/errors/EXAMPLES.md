# Error Handling Examples

Practical examples of using the error handling system in the FreshBooks MCP server.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Tool Implementation](#tool-implementation)
- [Error Detection](#error-detection)
- [Custom Error Creation](#custom-error-creation)
- [Testing](#testing)
- [Advanced Patterns](#advanced-patterns)

## Basic Usage

### Normalizing Any Error

```typescript
import { ErrorHandler } from "./errors/index.js";

try {
  // Some operation that might fail
  const result = await riskyOperation();
} catch (error) {
  // Convert any error to MCP format
  const mcpError = ErrorHandler.normalizeError(error, {
    tool: "my_tool",
    accountId: "ABC123",
    requestId: "req_xyz"
  });

  // mcpError is now a structured MCPError
  console.error(`Error ${mcpError.code}: ${mcpError.message}`);
  console.error(`Suggestion: ${mcpError.data.suggestion}`);

  throw mcpError;
}
```

### Using the Wrapper (Recommended)

```typescript
import { ErrorHandler } from "./errors/index.js";

// Wrap your handler - errors are automatically normalized
const myToolHandler = ErrorHandler.wrapHandler(
  "my_tool",
  async (input, context) => {
    // Any error thrown here will be automatically normalized
    const result = await doSomething(input);
    return result;
  }
);

// Use the wrapped handler
try {
  const result = await myToolHandler({ foo: "bar" }, { accountId: "ABC123" });
} catch (error) {
  // error is already a normalized MCPError
  console.error(error.message);
}
```

## Tool Implementation

### Complete Time Entry Tool

```typescript
// src/tools/time-entry/timeentry-single.ts

import { ErrorHandler, ToolContext } from "../../errors/index.js";
import { z } from "zod";
import { Client } from "@freshbooks/api";

// Input validation schema
const InputSchema = z.object({
  accountId: z.string().min(1, "Account ID is required"),
  timeEntryId: z.number().int().positive("Time entry ID must be positive")
});

// The handler implementation
async function handler(input: unknown, context: ToolContext) {
  // Step 1: Validate input (Zod errors automatically normalized)
  const { accountId, timeEntryId } = InputSchema.parse(input);

  // Step 2: Get FreshBooks client
  const client = getAuthenticatedClient(context);

  // Step 3: Call FreshBooks API (API errors automatically normalized)
  const response = await client.timeEntries.single(accountId, timeEntryId);

  // Step 4: Check response
  if (!response.ok) {
    // This will be normalized to MCPError automatically
    throw response;
  }

  // Step 5: Return result
  return {
    content: [{
      type: "text",
      text: JSON.stringify(response.data, null, 2)
    }]
  };
}

// Export wrapped handler
export const timeEntrySingleHandler = ErrorHandler.wrapHandler(
  "timeentry_single",
  handler
);
```

### List Tool with Pagination

```typescript
// src/tools/time-entry/timeentry-list.ts

import { ErrorHandler, ToolContext } from "../../errors/index.js";
import { z } from "zod";

const InputSchema = z.object({
  accountId: z.string(),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().min(1).max(100).default(30),
  filters: z.object({
    projectId: z.number().optional(),
    billable: z.boolean().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  }).optional()
});

async function handler(input: unknown, context: ToolContext) {
  const { accountId, page, perPage, filters } = InputSchema.parse(input);

  const client = getAuthenticatedClient(context);

  // Build query
  const queryBuilder = [];

  if (filters?.projectId) {
    queryBuilder.push({ equals: { projectId: filters.projectId } });
  }

  if (filters?.billable !== undefined) {
    queryBuilder.push({ boolean: { billable: filters.billable } });
  }

  if (filters?.startDate) {
    queryBuilder.push({
      greaterThanOrEqual: { startedAt: filters.startDate }
    });
  }

  if (filters?.endDate) {
    queryBuilder.push({
      lessThanOrEqual: { startedAt: filters.endDate }
    });
  }

  // Call API
  const response = await client.timeEntries.list(
    accountId,
    queryBuilder,
    { page, perPage }
  );

  if (!response.ok) {
    throw response;
  }

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        timeEntries: response.data,
        pagination: {
          page,
          perPage,
          total: response.pages?.total || 0,
          pages: response.pages?.pages || 0
        }
      }, null, 2)
    }]
  };
}

export const timeEntryListHandler = ErrorHandler.wrapHandler(
  "timeentry_list",
  handler
);
```

### Create Tool with Validation

```typescript
// src/tools/time-entry/timeentry-create.ts

import { ErrorHandler, ToolContext } from "../../errors/index.js";
import { z } from "zod";

const InputSchema = z.object({
  accountId: z.string(),
  data: z.object({
    startedAt: z.string().datetime("Invalid date format"),
    duration: z.number().int().nonnegative(),
    isLogged: z.boolean().default(true),
    projectId: z.number().int().positive().optional(),
    serviceId: z.number().int().positive().optional(),
    note: z.string().max(5000).optional(),
    billable: z.boolean().optional()
  })
});

async function handler(input: unknown, context: ToolContext) {
  // Validate - if this fails, Zod error is automatically normalized
  const { accountId, data } = InputSchema.parse(input);

  const client = getAuthenticatedClient(context);

  // Additional business logic validation
  if (data.billable && !data.projectId) {
    throw ErrorHandler.createValidationError(
      "Billable time entries require a project",
      { tool: "timeentry_create", accountId }
    );
  }

  // Create time entry
  const response = await client.timeEntries.create(data, accountId);

  if (!response.ok) {
    throw response;
  }

  return {
    content: [{
      type: "text",
      text: JSON.stringify(response.data, null, 2)
    }]
  };
}

export const timeEntryCreateHandler = ErrorHandler.wrapHandler(
  "timeentry_create",
  handler
);
```

## Error Detection

### Checking Error Types

```typescript
import {
  isMCPError,
  isFreshBooksError,
  isOAuthError,
  isNetworkError
} from "./errors/index.js";

async function someOperation() {
  try {
    await riskyCall();
  } catch (error) {
    if (isMCPError(error)) {
      console.log("Already normalized:", error.code);
      console.log("Recoverable:", error.data.recoverable);
    }

    if (isFreshBooksError(error)) {
      console.log("FreshBooks error code:", error.error.code);
      console.log("Field:", error.error.field);
    }

    if (isOAuthError(error)) {
      console.log("OAuth error:", error.code);
      // Re-authenticate
    }

    if (isNetworkError(error)) {
      console.log("Network issue, retrying...");
      // Implement retry logic
    }
  }
}
```

### Handling Specific Error Codes

```typescript
import { ErrorHandler, MCPErrorCode } from "./errors/index.js";

async function callWithRetry() {
  try {
    return await someApiCall();
  } catch (error) {
    const mcpError = ErrorHandler.normalizeError(error);

    // Handle rate limiting
    if (mcpError.code === MCPErrorCode.RATE_LIMITED) {
      const delay = mcpError.data.retryAfter || 60;
      console.log(`Rate limited, waiting ${delay}s...`);
      await sleep(delay * 1000);
      return await someApiCall(); // Retry
    }

    // Handle authentication
    if (mcpError.code === MCPErrorCode.NOT_AUTHENTICATED) {
      console.log("Re-authenticating...");
      await reAuthenticate();
      return await someApiCall(); // Retry
    }

    // Handle token expiration
    if (mcpError.code === MCPErrorCode.TOKEN_EXPIRED) {
      console.log("Refreshing token...");
      await refreshToken();
      return await someApiCall(); // Retry
    }

    // Non-recoverable error
    if (!mcpError.data.recoverable) {
      console.error("Non-recoverable error:", mcpError.message);
      throw mcpError;
    }

    throw mcpError;
  }
}
```

## Custom Error Creation

### Validation Errors

```typescript
import { ErrorHandler } from "./errors/index.js";

function validateBusinessRules(data: TimeEntryData) {
  // Check if timer already running
  if (data.active && hasActiveTimer()) {
    throw ErrorHandler.createValidationError(
      "Only one timer can be active at a time",
      { tool: "timer_start" }
    );
  }

  // Check if time entry is in the future
  if (new Date(data.startedAt) > new Date()) {
    throw ErrorHandler.createValidationError(
      "Cannot create time entries in the future",
      { tool: "timeentry_create", field: "startedAt" }
    );
  }

  // Check duration limits
  if (data.duration > 24 * 60 * 60) {
    throw ErrorHandler.createValidationError(
      "Duration cannot exceed 24 hours",
      { tool: "timeentry_create", field: "duration" }
    );
  }
}
```

### Authentication Errors

```typescript
import { ErrorHandler } from "./errors/index.js";

function getAuthenticatedClient(context: ToolContext): Client {
  const tokens = getStoredTokens();

  if (!tokens) {
    throw ErrorHandler.createAuthError(
      "No authentication found",
      { tool: context.tool }
    );
  }

  if (isTokenExpired(tokens.accessToken)) {
    throw ErrorHandler.createAuthError(
      "Access token has expired",
      { tool: context.tool }
    );
  }

  return new Client(tokens.accessToken);
}
```

### Not Found Errors

```typescript
import { ErrorHandler } from "./errors/index.js";

async function getTimeEntry(accountId: string, timeEntryId: number) {
  const response = await client.timeEntries.single(accountId, timeEntryId);

  if (!response.ok && response.error.code === "NOT_FOUND") {
    throw ErrorHandler.createNotFoundError(
      "TimeEntry",
      timeEntryId,
      { tool: "timeentry_single", accountId }
    );
  }

  return response.data;
}
```

## Testing

### Testing Error Normalization

```typescript
// tests/errors/error-mapper.test.ts

import { describe, test, expect } from "vitest";
import { ErrorMapper, MCPErrorCode } from "../../src/errors/index.js";

describe("ErrorMapper", () => {
  describe("mapFreshBooksError", () => {
    test("maps NOT_FOUND error", () => {
      const fbError = {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "TimeEntry with id 99999 was not found",
          errno: 1012,
          field: "timeEntryId"
        },
        statusCode: 404
      };

      const mcpError = ErrorMapper.mapFreshBooksError(fbError, {
        tool: "timeentry_single",
        entityId: 99999
      });

      expect(mcpError.code).toBe(MCPErrorCode.RESOURCE_NOT_FOUND);
      expect(mcpError.message).toContain("not found");
      expect(mcpError.data.recoverable).toBe(false);
      expect(mcpError.data.suggestion).toBeDefined();
      expect(mcpError.data.freshbooksError?.code).toBe("NOT_FOUND");
      expect(mcpError.data.context?.tool).toBe("timeentry_single");
    });

    test("maps RATE_LIMIT_EXCEEDED error", () => {
      const fbError = {
        ok: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Rate limit exceeded"
        },
        retryAfter: 60,
        statusCode: 429
      };

      const mcpError = ErrorMapper.mapFreshBooksError(fbError);

      expect(mcpError.code).toBe(MCPErrorCode.RATE_LIMITED);
      expect(mcpError.data.recoverable).toBe(true);
      expect(mcpError.data.retryAfter).toBe(60);
    });
  });

  describe("mapValidationError", () => {
    test("maps Zod validation error", () => {
      const zodError = new z.ZodError([
        {
          code: "invalid_type",
          expected: "string",
          received: "undefined",
          path: ["accountId"],
          message: "Required"
        },
        {
          code: "invalid_type",
          expected: "number",
          received: "string",
          path: ["timeEntryId"],
          message: "Expected number, received string"
        }
      ]);

      const mcpError = ErrorMapper.mapValidationError(zodError, {
        tool: "timeentry_single"
      });

      expect(mcpError.code).toBe(MCPErrorCode.INVALID_PARAMS);
      expect(mcpError.data.validationErrors).toHaveLength(2);
      expect(mcpError.data.validationErrors?.[0]?.path).toBe("accountId");
      expect(mcpError.data.suggestion).toContain("accountId");
    });
  });
});
```

### Testing Tool Error Handling

```typescript
// tests/tools/timeentry-single.test.ts

import { describe, test, expect, vi } from "vitest";
import { timeEntrySingleHandler } from "../../src/tools/time-entry/timeentry-single.js";
import { MCPErrorCode } from "../../src/errors/index.js";

describe("timeentry_single", () => {
  test("handles not found error", async () => {
    // Mock FreshBooks client to return not found
    vi.mock("@freshbooks/api", () => ({
      Client: vi.fn(() => ({
        timeEntries: {
          single: vi.fn(() => Promise.resolve({
            ok: false,
            error: {
              code: "NOT_FOUND",
              message: "TimeEntry not found"
            },
            statusCode: 404
          }))
        }
      }))
    }));

    await expect(
      timeEntrySingleHandler(
        { accountId: "ABC123", timeEntryId: 99999 },
        { accountId: "ABC123" }
      )
    ).rejects.toMatchObject({
      code: MCPErrorCode.RESOURCE_NOT_FOUND,
      message: expect.stringContaining("not found"),
      data: {
        recoverable: false,
        freshbooksError: {
          code: "NOT_FOUND"
        }
      }
    });
  });

  test("handles validation error", async () => {
    await expect(
      timeEntrySingleHandler(
        { accountId: "", timeEntryId: -1 },
        { accountId: "ABC123" }
      )
    ).rejects.toMatchObject({
      code: MCPErrorCode.INVALID_PARAMS,
      data: {
        recoverable: true,
        validationErrors: expect.arrayContaining([
          expect.objectContaining({
            path: expect.stringContaining("accountId")
          })
        ])
      }
    });
  });
});
```

## Advanced Patterns

### Retry with Exponential Backoff

```typescript
import { ErrorHandler, MCPErrorCode } from "./errors/index.js";

async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const mcpError = ErrorHandler.normalizeError(error);
      lastError = mcpError;

      // Don't retry non-recoverable errors
      if (!mcpError.data.recoverable) {
        throw mcpError;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay
      let delay: number;

      if (mcpError.code === MCPErrorCode.RATE_LIMITED && mcpError.data.retryAfter) {
        delay = mcpError.data.retryAfter * 1000;
      } else {
        delay = baseDelay * Math.pow(2, attempt);
      }

      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError;
}

// Usage
const result = await callWithRetry(
  () => client.timeEntries.list(accountId),
  3,  // max 3 retries
  1000  // 1s base delay
);
```

### Error Aggregation

```typescript
import { ErrorHandler, MCPError } from "./errors/index.js";

async function batchOperation(items: any[]): Promise<{
  succeeded: any[];
  failed: Array<{ item: any; error: MCPError }>;
}> {
  const results = await Promise.allSettled(
    items.map(item => processItem(item))
  );

  const succeeded: any[] = [];
  const failed: Array<{ item: any; error: MCPError }> = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      succeeded.push(result.value);
    } else {
      const mcpError = ErrorHandler.normalizeError(result.reason);
      failed.push({
        item: items[index],
        error: mcpError
      });
    }
  });

  return { succeeded, failed };
}

// Usage
const { succeeded, failed } = await batchOperation(timeEntries);

console.log(`Successfully processed ${succeeded.length} items`);

if (failed.length > 0) {
  console.error(`Failed to process ${failed.length} items:`);
  failed.forEach(({ item, error }) => {
    console.error(`- ${item.id}: ${error.message}`);
    console.error(`  Suggestion: ${error.data.suggestion}`);
  });
}
```

### Conditional Error Handling

```typescript
import { ErrorHandler, MCPErrorCode } from "./errors/index.js";

async function smartOperation() {
  try {
    return await client.timeEntries.create(data, accountId);
  } catch (error) {
    const mcpError = ErrorHandler.normalizeError(error);

    // Handle specific scenarios
    switch (mcpError.code) {
      case MCPErrorCode.TOKEN_EXPIRED:
        // Try to refresh token
        await refreshToken();
        // Retry operation
        return await client.timeEntries.create(data, accountId);

      case MCPErrorCode.CONFLICT:
        // Resource exists, try to update instead
        return await client.timeEntries.update(data, accountId, existingId);

      case MCPErrorCode.VALIDATION_ERROR:
        // Try with default values
        const dataWithDefaults = { ...defaultData, ...data };
        return await client.timeEntries.create(dataWithDefaults, accountId);

      case MCPErrorCode.RATE_LIMITED:
        // Wait and retry
        await sleep(mcpError.data.retryAfter! * 1000);
        return await client.timeEntries.create(data, accountId);

      default:
        // Can't handle, re-throw
        throw mcpError;
    }
  }
}
```

## Summary

Key takeaways:

1. **Always use ErrorHandler.wrapHandler()** for tool implementations
2. **Validate input with Zod** - validation errors are automatically normalized
3. **Let FreshBooks errors bubble up** - they're automatically normalized
4. **Use type guards** to check error types before accessing properties
5. **Include context** in all error normalization calls
6. **Check recoverable flag** before implementing retry logic
7. **Test error paths** just like success paths
8. **Preserve debugging info** by always including context
