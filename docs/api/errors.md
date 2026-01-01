# Error Reference

Complete reference for all error codes used by the FreshBooks MCP server. All errors follow the JSON-RPC 2.0 error object specification.

## Error Response Format

All errors are returned in standardized JSON-RPC 2.0 format:

```json
{
  "jsonrpc": "2.0",
  "id": "request-id",
  "error": {
    "code": -32603,
    "message": "Human-readable error message",
    "data": {
      "freshbooksError": {
        "code": "NOT_FOUND",
        "message": "Original FreshBooks error message",
        "errno": 1012,
        "statusCode": 404
      },
      "recoverable": false,
      "suggestion": "What to do next",
      "context": {
        "tool": "timeentry_single",
        "accountId": "ABC123",
        "entityId": 99999
      }
    }
  }
}
```

### Error Object Fields

| Field | Type | Description |
|-------|------|-------------|
| code | number | MCP error code (see below) |
| message | string | User-friendly error message |
| data | object | Additional error details |

### Error Data Fields

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| freshbooksError | object | Yes | Original FreshBooks API error |
| validationErrors | array | Yes | Zod validation errors |
| context | object | Yes | Contextual information |
| recoverable | boolean | No | Whether error can be recovered from |
| suggestion | string | Yes | Recommended recovery action |
| retryAfter | number | Yes | Seconds to wait before retry (rate limiting) |
| authUrl | string | Yes | Authorization URL (auth errors) |
| statusCode | number | Yes | HTTP status code |

---

## Standard JSON-RPC Error Codes

Standard error codes defined by JSON-RPC 2.0 specification.

| Code | Name | Description | Recoverable |
|------|------|-------------|-------------|
| -32700 | Parse Error | Invalid JSON received | No |
| -32600 | Invalid Request | Invalid request object | No |
| -32601 | Method Not Found | Tool does not exist | No |
| -32602 | Invalid Params | Invalid tool parameters | No |
| -32603 | Internal Error | Internal server error | Depends |

### -32700 Parse Error

**When:** Invalid JSON in request
**Cause:** Malformed JSON syntax
**Recovery:** Fix JSON syntax

**Example:**
```json
{
  "code": -32700,
  "message": "Invalid JSON was received",
  "data": {
    "recoverable": false,
    "suggestion": "Check JSON syntax is valid"
  }
}
```

### -32600 Invalid Request

**When:** Request object is invalid
**Cause:** Missing required fields, wrong structure
**Recovery:** Fix request format

**Example:**
```json
{
  "code": -32600,
  "message": "The JSON sent is not a valid request",
  "data": {
    "recoverable": false,
    "suggestion": "Ensure request has jsonrpc, method, and id fields"
  }
}
```

### -32601 Method Not Found

**When:** Requested tool doesn't exist
**Cause:** Typo in tool name, tool not implemented
**Recovery:** Use valid tool name

**Example:**
```json
{
  "code": -32601,
  "message": "The method does not exist or is not available",
  "data": {
    "recoverable": false,
    "suggestion": "Check tool name is spelled correctly",
    "context": {
      "requestedMethod": "timeentry_lis"
    }
  }
}
```

### -32602 Invalid Params

**When:** Tool parameters are invalid
**Cause:** Missing required params, wrong type, validation failure
**Recovery:** Fix parameter values

**Example:**
```json
{
  "code": -32602,
  "message": "Invalid method parameters",
  "data": {
    "validationErrors": [
      {
        "path": "accountId",
        "message": "Required",
        "code": "invalid_type",
        "expected": "string",
        "received": "undefined"
      },
      {
        "path": "duration",
        "message": "Number must be greater than or equal to 0",
        "code": "too_small",
        "expected": "0",
        "received": "-100"
      }
    ],
    "recoverable": false,
    "suggestion": "Provide valid parameters matching the schema"
  }
}
```

### -32603 Internal Error

**When:** Unexpected server error
**Cause:** Various (network, FreshBooks API, server bug)
**Recovery:** Depends on specific error

**Example:**
```json
{
  "code": -32603,
  "message": "Internal server error",
  "data": {
    "recoverable": true,
    "suggestion": "Retry the request"
  }
}
```

---

## Custom Application Error Codes

Application-specific error codes (range: -32000 to -32099).

| Code | Name | Description | Recoverable |
|------|------|-------------|-------------|
| -32001 | Not Authenticated | Authentication required | Yes |
| -32002 | Token Expired | Access token expired | Yes |
| -32003 | Permission Denied | Insufficient permissions | No |
| -32004 | Rate Limited | API rate limit exceeded | Yes |
| -32005 | Resource Not Found | Requested resource not found | No |
| -32006 | Validation Error | Data validation failed | No |
| -32007 | Conflict | Resource conflict (duplicate, state) | Depends |
| -32008 | Service Unavailable | FreshBooks API unavailable | Yes |
| -32009 | Network Error | Network communication error | Yes |
| -32010 | Timeout | Request timeout | Yes |

### -32001 Not Authenticated

**When:** User not authenticated
**Cause:** No valid OAuth tokens
**Recovery:** Call auth_get_url to authenticate

**Example:**
```json
{
  "code": -32001,
  "message": "Authentication required",
  "data": {
    "recoverable": true,
    "suggestion": "Call auth_get_url to start authentication",
    "authUrl": "https://my.freshbooks.com/service/auth/oauth/authorize?..."
  }
}
```

### -32002 Token Expired

**When:** Access token expired
**Cause:** Token validity period ended
**Recovery:** Automatic refresh, or re-authenticate

**Example:**
```json
{
  "code": -32002,
  "message": "Authentication token expired",
  "data": {
    "recoverable": true,
    "suggestion": "Token will be automatically refreshed, please retry",
    "freshbooksError": {
      "code": "TOKEN_EXPIRED",
      "statusCode": 401
    }
  }
}
```

### -32003 Permission Denied

**When:** User lacks permission for operation
**Cause:** OAuth scope insufficient, account restrictions
**Recovery:** Re-authenticate with required scopes

**Example:**
```json
{
  "code": -32003,
  "message": "Permission denied",
  "data": {
    "recoverable": false,
    "suggestion": "Re-authenticate with required permissions",
    "freshbooksError": {
      "code": "FORBIDDEN",
      "message": "You do not have permission to access this resource",
      "statusCode": 403
    }
  }
}
```

### -32004 Rate Limited

**When:** API rate limit exceeded
**Cause:** Too many requests in time window
**Recovery:** Wait and retry

**Example:**
```json
{
  "code": -32004,
  "message": "API rate limit exceeded",
  "data": {
    "recoverable": true,
    "suggestion": "Wait a moment and retry the request",
    "retryAfter": 60,
    "freshbooksError": {
      "code": "RATE_LIMIT_EXCEEDED",
      "statusCode": 429
    }
  }
}
```

### -32005 Resource Not Found

**When:** Requested resource doesn't exist
**Cause:** Invalid ID, resource deleted
**Recovery:** Verify ID is correct

**Example:**
```json
{
  "code": -32005,
  "message": "Resource not found in FreshBooks",
  "data": {
    "recoverable": false,
    "suggestion": "Verify the resource ID and account ID are correct",
    "context": {
      "tool": "timeentry_single",
      "accountId": "ABC123",
      "timeEntryId": 99999
    },
    "freshbooksError": {
      "code": "NOT_FOUND",
      "message": "TimeEntry with id 99999 was not found",
      "errno": 1012,
      "statusCode": 404
    }
  }
}
```

### -32006 Validation Error

**When:** FreshBooks API validation fails
**Cause:** Invalid data values, business rule violation
**Recovery:** Fix data and retry

**Example:**
```json
{
  "code": -32006,
  "message": "Validation error from FreshBooks API",
  "data": {
    "recoverable": false,
    "suggestion": "Check the input parameters and try again",
    "freshbooksError": {
      "code": "VALIDATION_ERROR",
      "message": "Project with id 999 does not exist",
      "field": "projectId",
      "statusCode": 422
    }
  }
}
```

### -32007 Conflict

**When:** Resource conflict
**Cause:** Duplicate resource, invalid state transition
**Recovery:** Depends on specific conflict

**Example:**
```json
{
  "code": -32007,
  "message": "Resource conflict",
  "data": {
    "recoverable": true,
    "suggestion": "Stop existing timer first with timer_stop",
    "freshbooksError": {
      "code": "CONFLICT",
      "message": "A timer is already running for this user",
      "statusCode": 409
    }
  }
}
```

### -32008 Service Unavailable

**When:** FreshBooks API unavailable
**Cause:** Maintenance, outage
**Recovery:** Wait and retry

**Example:**
```json
{
  "code": -32008,
  "message": "FreshBooks API temporarily unavailable",
  "data": {
    "recoverable": true,
    "suggestion": "FreshBooks may be undergoing maintenance, try again later",
    "freshbooksError": {
      "code": "SERVICE_UNAVAILABLE",
      "statusCode": 503
    }
  }
}
```

### -32009 Network Error

**When:** Network communication fails
**Cause:** Connection timeout, DNS failure, network unreachable
**Recovery:** Check connection and retry

**Example:**
```json
{
  "code": -32009,
  "message": "Network communication error",
  "data": {
    "recoverable": true,
    "suggestion": "Check network connection and retry",
    "context": {
      "errorCode": "ENOTFOUND"
    }
  }
}
```

### -32010 Timeout

**When:** Request exceeds timeout
**Cause:** Slow network, large dataset, FreshBooks delay
**Recovery:** Retry request

**Example:**
```json
{
  "code": -32010,
  "message": "Request timeout",
  "data": {
    "recoverable": true,
    "suggestion": "Retry the request"
  }
}
```

---

## FreshBooks Error Code Mapping

How FreshBooks API errors map to MCP errors.

| FreshBooks Code | MCP Code | Description |
|-----------------|----------|-------------|
| UNAUTHORIZED | -32001 | Not authenticated |
| UNAUTHENTICATED | -32001 | Not authenticated |
| TOKEN_EXPIRED | -32002 | Token expired |
| INVALID_GRANT | -32001 | Invalid OAuth grant |
| FORBIDDEN | -32003 | Permission denied |
| INSUFFICIENT_PERMISSIONS | -32003 | Permission denied |
| NOT_FOUND | -32005 | Resource not found |
| VALIDATION_ERROR | -32006 | Validation failed |
| BAD_REQUEST | -32602 | Invalid parameters |
| RATE_LIMIT_EXCEEDED | -32004 | Rate limited |
| CONFLICT | -32007 | Resource conflict |
| INTERNAL_ERROR | -32603 | Server error |
| SERVICE_UNAVAILABLE | -32008 | Service unavailable |

---

## Error Handling Best Practices

### Check Recoverable Flag

```typescript
if (error.data.recoverable) {
  // Can retry or recover
  if (error.data.suggestion) {
    console.log("Suggestion:", error.data.suggestion);
  }
  if (error.data.retryAfter) {
    // Wait before retry
    await sleep(error.data.retryAfter * 1000);
    retry();
  }
} else {
  // Cannot recover, show error to user
  console.error(error.message);
}
```

### Handle Authentication Errors

```typescript
if (error.code === -32001) {
  // Not authenticated
  const authUrl = await auth_get_url();
  console.log("Please authenticate:", authUrl.authorizationUrl);
}

if (error.code === -32002) {
  // Token expired - auto-refresh happens, just retry
  return retry();
}
```

### Handle Rate Limiting

```typescript
if (error.code === -32004) {
  const retryAfter = error.data.retryAfter || 60;
  console.log(`Rate limited, waiting ${retryAfter} seconds...`);
  await sleep(retryAfter * 1000);
  return retry();
}
```

### Handle Validation Errors

```typescript
if (error.code === -32602) {
  // Invalid parameters
  if (error.data.validationErrors) {
    error.data.validationErrors.forEach(err => {
      console.error(`${err.path}: ${err.message}`);
    });
  }
}

if (error.code === -32006) {
  // FreshBooks validation error
  const fbError = error.data.freshbooksError;
  console.error(`${fbError.field}: ${fbError.message}`);
}
```

### Preserve Original Errors

```typescript
// Original FreshBooks error always preserved
if (error.data.freshbooksError) {
  console.log("FreshBooks error code:", error.data.freshbooksError.code);
  console.log("FreshBooks message:", error.data.freshbooksError.message);
  console.log("HTTP status:", error.data.freshbooksError.statusCode);
  console.log("Error number:", error.data.freshbooksError.errno);
}
```

---

## Common Error Scenarios

### Scenario: Not Authenticated

```
timeentry_list({ accountId: "ABC123" })

Error:
{
  "code": -32001,
  "message": "Authentication required",
  "data": {
    "recoverable": true,
    "suggestion": "Call auth_get_url to start authentication"
  }
}

Recovery:
1. Call auth_get_url()
2. User authorizes
3. Call auth_exchange_code()
4. Retry original request
```

### Scenario: Invalid Parameter

```
timeentry_create({
  accountId: "ABC123",
  duration: -100
})

Error:
{
  "code": -32602,
  "message": "Invalid method parameters",
  "data": {
    "validationErrors": [
      {
        "path": "duration",
        "message": "Number must be greater than or equal to 0"
      }
    ],
    "recoverable": false
  }
}

Recovery:
Fix duration to positive value and retry
```

### Scenario: Resource Not Found

```
timeentry_single({
  accountId: "ABC123",
  timeEntryId: 99999
})

Error:
{
  "code": -32005,
  "message": "Resource not found in FreshBooks",
  "data": {
    "recoverable": false,
    "suggestion": "Verify the time entry ID exists",
    "freshbooksError": {
      "code": "NOT_FOUND",
      "message": "TimeEntry with id 99999 was not found"
    }
  }
}

Recovery:
Verify ID is correct, use timeentry_list to find valid IDs
```

### Scenario: Timer Already Running

```
timer_start({
  accountId: "ABC123",
  projectId: 42
})

Error:
{
  "code": -32007,
  "message": "Resource conflict",
  "data": {
    "recoverable": true,
    "suggestion": "Stop existing timer first with timer_stop",
    "freshbooksError": {
      "code": "CONFLICT",
      "message": "A timer is already running"
    }
  }
}

Recovery:
1. Call timer_current() to find active timer
2. Call timer_stop() to stop it
3. Retry timer_start()
```

### Scenario: Rate Limit

```
// After many rapid requests...

Error:
{
  "code": -32004,
  "message": "API rate limit exceeded",
  "data": {
    "recoverable": true,
    "suggestion": "Wait a moment and retry the request",
    "retryAfter": 60
  }
}

Recovery:
Wait 60 seconds and retry
```

---

## Error Code Quick Reference

| Code | Name | Recovery |
|------|------|----------|
| -32700 | Parse Error | Fix JSON syntax |
| -32600 | Invalid Request | Fix request structure |
| -32601 | Method Not Found | Use valid tool name |
| -32602 | Invalid Params | Fix parameters |
| -32603 | Internal Error | Retry or contact support |
| -32001 | Not Authenticated | Call auth_get_url |
| -32002 | Token Expired | Retry (auto-refresh) |
| -32003 | Permission Denied | Re-auth with permissions |
| -32004 | Rate Limited | Wait and retry |
| -32005 | Not Found | Verify resource ID |
| -32006 | Validation Error | Fix data values |
| -32007 | Conflict | Resolve conflict |
| -32008 | Service Unavailable | Wait and retry |
| -32009 | Network Error | Check connection |
| -32010 | Timeout | Retry request |
