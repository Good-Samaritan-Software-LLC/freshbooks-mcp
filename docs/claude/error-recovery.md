# Error Recovery Guide - Handling Failures Gracefully

This document provides Claude with strategies for handling errors and guiding users through recovery. All errors are normalized to MCP format but preserve FreshBooks details.

## Table of Contents

- [Error Structure](#error-structure)
- [Authentication Errors](#authentication-errors)
- [Validation Errors](#validation-errors)
- [Not Found Errors](#not-found-errors)
- [Rate Limiting](#rate-limiting)
- [Permission Errors](#permission-errors)
- [Network Errors](#network-errors)
- [Business Logic Errors](#business-logic-errors)
- [Recovery Workflows](#recovery-workflows)

---

## Error Structure

### MCP Error Format

All errors from FreshBooks tools follow this structure:

```json
{
  "code": -32005,
  "message": "User-friendly error message",
  "data": {
    "freshbooksError": {
      // Original FreshBooks error details
    },
    "recoverable": true,
    "suggestion": "What to do next"
  }
}
```

### Error Codes

**MCP Standard Codes:**
- `-32600` - Invalid Request
- `-32601` - Method not found
- `-32602` - Invalid params
- `-32603` - Internal error
- `-32005` - Server error (FreshBooks errors map here)

**What Claude should do:**
- Check `data.recoverable` - can this be fixed?
- Read `data.suggestion` - specific next steps
- Check `data.freshbooksError` - original error details
- Present user-friendly message from `message`

---

## Authentication Errors

### Error: UNAUTHORIZED - Invalid or expired access token

**When this happens:**
- User's OAuth token has expired
- Token was revoked
- Invalid token in storage
- User never authenticated

**Error details:**
```json
{
  "code": -32005,
  "message": "Your FreshBooks session has expired. Please reconnect.",
  "data": {
    "freshbooksError": {
      "error": "invalid_grant",
      "error_description": "The access token is invalid or has expired"
    },
    "recoverable": true,
    "suggestion": "Call auth_get_url to get a new authorization URL"
  }
}
```

**Claude should:**

1. **Confirm the auth status:**
   ```
   → auth_status
   → If authenticated=false, proceed
   ```

2. **Get new authorization URL:**
   ```
   → auth_get_url
   → Extract authorizationUrl
   ```

3. **Guide user:**
   ```
   "Your FreshBooks session has expired. To reconnect:

   1. Visit this URL to authorize: [authorizationUrl]
   2. After authorizing, you'll receive a code
   3. Come back here and provide the code

   Say 'I have the code' when ready."
   ```

4. **Wait for user's code:**
   ```
   User: "The code is ABC123XYZ"
   → auth_exchange_code with code="ABC123XYZ"
   ```

5. **Retry original operation:**
   ```
   "✅ Reconnected successfully! Let me retry your request..."
   → Retry the tool that failed
   ```

**Example conversation:**
```
User: "Show my time entries"
→ timeentry_list fails with UNAUTHORIZED

Claude: "Your FreshBooks session has expired. To reconnect:
1. Visit: https://my.freshbooks.com/service/auth/oauth/authorize?...
2. Authorize the app
3. Provide the code you receive

Say 'I have the code' when ready."

User: "I have the code ABC123"
→ auth_exchange_code code=ABC123
→ Success!

Claude: "✅ Reconnected! Now showing your time entries..."
→ timeentry_list (retry)
→ Success, show results
```

---

### Error: FORBIDDEN - Insufficient permissions

**When this happens:**
- User's account doesn't have permission for this action
- Trying to access another user's data
- Account plan doesn't support this feature

**Error details:**
```json
{
  "code": -32005,
  "message": "You don't have permission to access this resource",
  "data": {
    "freshbooksError": {
      "error": "forbidden",
      "message": "Insufficient permissions"
    },
    "recoverable": false,
    "suggestion": "Check account permissions or upgrade plan"
  }
}
```

**Claude should:**

1. **Explain the limitation:**
   ```
   "You don't have permission to [action]. This might be because:
   - Your account role doesn't include this permission
   - This feature requires a different FreshBooks plan
   - You're trying to access data from another account"
   ```

2. **Suggest alternatives:**
   ```
   "What you can do instead:
   - Ask your account administrator for permission
   - Check if there's a similar feature you can access
   - Verify you're using the correct accountId"
   ```

3. **Offer to check account:**
   ```
   → auth_status to show current user and account
   "You're currently logged in as [user] on account [accountId]"
   ```

**Not recoverable** - User must contact admin or upgrade

---

## Validation Errors

### Error: Required field missing

**When this happens:**
- Tool called without required parameter
- Field that should have value is null/undefined
- Invalid data type

**Error details:**
```json
{
  "code": -32602,
  "message": "duration is required",
  "data": {
    "freshbooksError": {
      "field": "duration",
      "message": "duration is required"
    },
    "recoverable": true,
    "suggestion": "Ask user for the missing field"
  }
}
```

**Claude should:**

1. **Identify missing field from error:**
   ```
   Error mentions "duration is required"
   → Need to get duration from user
   ```

2. **Ask user for missing information:**
   ```
   "How long was this time entry? Please provide the duration in hours or minutes."

   Wait for response, then convert:
   User: "2 hours" → duration: 7200 seconds
   User: "45 minutes" → duration: 2700 seconds
   ```

3. **Retry with complete data:**
   ```
   → timeentry_create with all required fields
   ```

**Example:**
```
User: "Log time on Mobile App"
→ timeentry_create missing duration
→ ERROR: duration is required

Claude: "How many hours did you work on Mobile App?"

User: "3 hours"
→ Convert to 10800 seconds
→ timeentry_create with duration=10800
→ Success!
```

---

### Error: Invalid value

**When this happens:**
- Value is wrong type (string instead of number)
- Value is out of range (negative duration)
- Value doesn't match enum (invalid billingMethod)
- Date format is wrong

**Error details:**
```json
{
  "code": -32602,
  "message": "Invalid value for duration: -100",
  "data": {
    "freshbooksError": {
      "field": "duration",
      "value": -100,
      "message": "duration must be positive"
    },
    "recoverable": true,
    "suggestion": "Provide a positive duration value"
  }
}
```

**Claude should:**

1. **Explain the constraint:**
   ```
   "Duration must be a positive number (greater than 0). You provided: -100"
   ```

2. **Ask for correct value:**
   ```
   "How many hours or minutes should this time entry be?"
   ```

3. **Validate before retrying:**
   ```
   User: "2 hours"
   → duration = 2 × 3600 = 7200
   → Verify 7200 > 0 ✓
   → Retry
   ```

**Common validation errors:**

**Negative duration:**
```
"Duration must be positive. How many hours/minutes did you work?"
```

**Invalid date format:**
```
ERROR: startedAt must be ISO 8601 format
Claude: "Converting 'January 15' to 2024-01-15T00:00:00Z"
→ Retry with proper format
```

**Invalid enum value:**
```
ERROR: billingMethod must be one of: project_rate, service_rate, flat_rate, team_member_rate
Claude: "Invalid billing method. Please choose:
1. project_rate - Bill at project's hourly rate
2. service_rate - Bill at service rates
3. flat_rate - Fixed price
4. team_member_rate - Individual rates"
```

---

## Not Found Errors

### Error: Resource not found

**When this happens:**
- ID doesn't exist in the database
- Resource was deleted
- Wrong accountId
- Typo in ID

**Error details:**
```json
{
  "code": -32005,
  "message": "TimeEntry with id 12345 was not found",
  "data": {
    "freshbooksError": {
      "error": "not_found",
      "resource": "TimeEntry",
      "id": 12345
    },
    "recoverable": true,
    "suggestion": "Verify the ID or use list tools to find the resource"
  }
}
```

**Claude should:**

1. **Acknowledge the issue:**
   ```
   "I couldn't find time entry #12345. It may have been deleted or the ID might be incorrect."
   ```

2. **Offer to search:**
   ```
   "Would you like me to:
   1. Show your recent time entries so you can find the right one
   2. Search for a specific entry by date or project"
   ```

3. **If user wants to search:**
   ```
   → timeentry_list with appropriate filters
   → Present results for user to select
   ```

**Example:**
```
User: "Delete time entry 99999"
→ timeentry_delete id=99999
→ ERROR: TimeEntry not found

Claude: "I couldn't find entry #99999. It may have been already deleted.

Would you like to see your recent time entries to find the right one?"

User: "Yes"
→ timeentry_list perPage=10
→ Show last 10 entries with IDs
```

---

### Error: Project not found (name resolution)

**When this happens:**
- User mentioned project name that doesn't exist
- Multiple projects match the name
- Project was deleted

**Claude should:**

1. **Search for similar names:**
   ```
   User: "Log time on Mobile Ap"
   → project_list to find "Mobile Ap"
   → No exact match found
   ```

2. **Suggest alternatives:**
   ```
   "I couldn't find a project called 'Mobile Ap'.

   Did you mean one of these?
   - Mobile App (Acme Corp)
   - Mobile Website (TechStart)"
   ```

3. **If no close matches:**
   ```
   "I couldn't find a project matching 'Mobile Ap'.

   Options:
   1. Show all active projects
   2. Create a new project called 'Mobile Ap'
   3. Try a different name"
   ```

4. **User clarifies or chooses:**
   ```
   User: "I meant Mobile App"
   → project_list to find "Mobile App" exactly
   → Use that projectId
   ```

---

## Rate Limiting

### Error: Rate limit exceeded

**When this happens:**
- Too many requests in short time
- FreshBooks API throttling
- Burst limit reached

**Error details:**
```json
{
  "code": -32005,
  "message": "Rate limit exceeded. Retry after 60 seconds",
  "data": {
    "freshbooksError": {
      "error": "rate_limit_exceeded",
      "retry_after": 60
    },
    "recoverable": true,
    "suggestion": "Wait 60 seconds and retry"
  }
}
```

**Claude should:**

1. **Inform user of delay:**
   ```
   "FreshBooks is temporarily limiting requests. I'll wait a moment and try again."
   ```

2. **Wait the specified time:**
   ```
   → Extract retry_after: 60 seconds
   → Wait 60 seconds (or inform user of wait time)
   ```

3. **Retry automatically:**
   ```
   → After waiting, retry the operation
   → If successful: proceed normally
   → If still rate limited: wait longer
   ```

**Example:**
```
User: "Show all my time entries"
→ timeentry_list
→ ERROR: Rate limit exceeded, retry after 60s

Claude: "FreshBooks is temporarily limiting requests. I'll try again in a minute..."

→ Wait 60 seconds
→ timeentry_list (retry)
→ Success!

Claude: "Here are your time entries: ..."
```

**If user is impatient:**
```
User: "Why is it taking so long?"
Claude: "FreshBooks limits how many requests we can make per minute to protect their servers. We'll be able to continue in about 30 more seconds."
```

---

## Permission Errors

### Error: Cannot access this account

**When this happens:**
- User tries to access accountId they don't own
- Account is disabled
- User was removed from account

**Error details:**
```json
{
  "code": -32005,
  "message": "You do not have access to account ABC123",
  "data": {
    "freshbooksError": {
      "error": "forbidden",
      "account_id": "ABC123"
    },
    "recoverable": false,
    "suggestion": "Use auth_status to see available accounts"
  }
}
```

**Claude should:**

1. **Check current account:**
   ```
   → auth_status
   → Show user their current accountId and available accounts
   ```

2. **Explain the issue:**
   ```
   "You don't have access to account ABC123.

   Your current account is: XYZ789

   You can only access accounts you own or have been granted permission to use."
   ```

3. **Suggest correction:**
   ```
   "Did you mean to use your account XYZ789 instead?"
   ```

---

### Error: Project is complete/inactive

**When this happens:**
- Trying to log time to completed project
- Project is marked inactive
- Business rule prevents this action

**Error details:**
```json
{
  "code": -32005,
  "message": "Cannot add time to completed project",
  "data": {
    "freshbooksError": {
      "project_id": 123,
      "status": "complete"
    },
    "recoverable": true,
    "suggestion": "Reactivate project or choose a different one"
  }
}
```

**Claude should:**

1. **Explain the constraint:**
   ```
   "Project 'Mobile App' is marked as complete and isn't accepting new time entries."
   ```

2. **Offer solutions:**
   ```
   "What would you like to do?
   1. Reactivate the project (mark it as incomplete)
   2. Choose a different active project
   3. Cancel this time entry"
   ```

3. **If user wants to reactivate:**
   ```
   → project_update with:
     - projectId: 123
     - complete: false
     - active: true

   → Then retry timeentry_create
   ```

---

## Network Errors

### Error: Connection timeout

**When this happens:**
- Network is slow/down
- FreshBooks API is slow to respond
- Request took too long

**Error details:**
```json
{
  "code": -32603,
  "message": "Request timeout",
  "data": {
    "recoverable": true,
    "suggestion": "Retry the request"
  }
}
```

**Claude should:**

1. **Retry automatically (up to 3 times):**
   ```
   Attempt 1: → ERROR: timeout
   Wait 2 seconds
   Attempt 2: → ERROR: timeout
   Wait 4 seconds
   Attempt 3: → SUCCESS or final error
   ```

2. **Inform user if multiple failures:**
   ```
   "I'm having trouble connecting to FreshBooks. This might be due to:
   - Network connectivity issues
   - FreshBooks service being slow

   I've tried 3 times. Would you like me to try again?"
   ```

---

### Error: Service unavailable

**When this happens:**
- FreshBooks API is down for maintenance
- Server error on FreshBooks side
- Temporary outage

**Error details:**
```json
{
  "code": -32005,
  "message": "FreshBooks service is temporarily unavailable",
  "data": {
    "freshbooksError": {
      "error": "service_unavailable",
      "status": 503
    },
    "recoverable": true,
    "suggestion": "Retry in a few minutes"
  }
}
```

**Claude should:**

1. **Inform user of outage:**
   ```
   "FreshBooks service is temporarily unavailable. This is likely due to maintenance or a temporary outage."
   ```

2. **Suggest next steps:**
   ```
   "I can try again in a few minutes, or you can:
   - Check FreshBooks status page
   - Try again later
   - Wait for service to restore"
   ```

3. **Offer to retry:**
   ```
   User: "Try again in 5 minutes"
   → Wait, then retry
   ```

---

## Business Logic Errors

### Error: Timer already active

**When this happens:**
- User tries to start timer when one is running
- FreshBooks allows only one active timer per user

**Error details:**
```json
{
  "code": -32005,
  "message": "A timer is already active",
  "data": {
    "freshbooksError": {
      "active_timer_id": 12345
    },
    "recoverable": true,
    "suggestion": "Stop the active timer first"
  }
}
```

**Claude should:**

1. **Check current timer:**
   ```
   → timer_current
   → Get active timer details
   ```

2. **Inform user:**
   ```
   "You already have a timer running on 'Mobile App' (started 2 hours ago).

   What would you like to do?
   1. Stop the current timer and start a new one
   2. Keep the current timer running
   3. Cancel"
   ```

3. **If user chooses to stop and start new:**
   ```
   → timer_stop with id=12345
   → timer_start with new project

   "Stopped timer on Mobile App (2 hours logged). Started new timer on Website Redesign."
   ```

---

### Error: Cannot delete billed time

**When this happens:**
- Trying to delete time entry that's been invoiced
- Business rule prevents deletion of billed time

**Error details:**
```json
{
  "code": -32005,
  "message": "Cannot delete time entry that has been billed",
  "data": {
    "freshbooksError": {
      "time_entry_id": 12345,
      "billed": true,
      "invoice_id": 456
    },
    "recoverable": false,
    "suggestion": "Time is on invoice #456, cannot be deleted"
  }
}
```

**Claude should:**

1. **Explain the constraint:**
   ```
   "This time entry can't be deleted because it's already been billed on invoice #456."
   ```

2. **Suggest alternatives:**
   ```
   "If you need to correct this:
   1. Remove the time from invoice #456 first
   2. Then delete the time entry
   3. Or adjust the invoice directly"
   ```

**Not recoverable without invoice modification**

---

### Error: Service has no rate configured

**When this happens:**
- Project uses service_rate billing
- Service doesn't have a rate set
- Can't calculate billing amount

**Error details:**
```json
{
  "code": -32005,
  "message": "Service 'Development' has no rate configured",
  "data": {
    "freshbooksError": {
      "service_id": 789,
      "service_name": "Development"
    },
    "recoverable": true,
    "suggestion": "Set a rate for this service using service_rate_set"
  }
}
```

**Claude should:**

1. **Explain the issue:**
   ```
   "The 'Development' service doesn't have a rate configured, which is required for this project's billing method."
   ```

2. **Offer to set rate:**
   ```
   "What hourly rate should I set for Development service?
   (e.g., $150/hr)"
   ```

3. **Set rate and retry:**
   ```
   User: "$150 per hour"
   → service_rate_set:
     - serviceId: 789
     - rate: "150"
     - code: "USD"

   → Retry original operation
   ```

---

## Recovery Workflows

### Workflow: Full Recovery from Auth Expiration

```
1. User operation fails with auth error
   → Save operation context (what they were trying to do)

2. Check auth status
   → auth_status
   → Confirm authenticated=false

3. Get new auth URL
   → auth_get_url
   → Present URL to user

4. User authorizes and provides code
   → auth_exchange_code with code
   → Store new token

5. Verify auth worked
   → auth_status
   → Confirm authenticated=true

6. Retry original operation
   → Use saved context
   → Execute original tool with original parameters
   → Success!
```

---

### Workflow: Resolve Name to ID Failure

```
1. User mentions entity by name
   → project_list to find "Mobile Ap"

2. No exact match found
   → Search for partial matches (fuzzy search)
   → Find: "Mobile App", "Mobile Website"

3. Multiple matches found
   → Present options to user:
     "I found 2 projects:
     1. Mobile App (Acme Corp)
     2. Mobile Website (TechStart)
     Which one?"

4. User clarifies
   → User says "1" or "Mobile App"
   → Extract projectId

5. Complete original operation
   → Use resolved projectId
```

---

### Workflow: Retry with Exponential Backoff

For transient errors (network, rate limit):

```
Attempt 1:
→ Execute tool
→ Error (network timeout)
→ Wait 1 second

Attempt 2:
→ Execute tool
→ Error (network timeout)
→ Wait 2 seconds

Attempt 3:
→ Execute tool
→ Error (network timeout)
→ Wait 4 seconds

Attempt 4:
→ Execute tool
→ Success!

OR

Attempt 4:
→ Execute tool
→ Error (still failing)
→ Give up, inform user
```

---

### Workflow: Validation Error Correction Loop

```
1. Execute tool with user-provided data
   → timeentry_create with partial data
   → ERROR: duration is required

2. Ask for missing field
   → "How many hours?"
   → User: "3 hours"

3. Validate input
   → Convert "3 hours" → 10800 seconds
   → Verify > 0 ✓

4. Retry with complete data
   → timeentry_create with duration=10800
   → Success!
```

---

## Summary for Claude

**Error handling principles:**

1. **Always read the full error** - code, message, data.suggestion
2. **Check if recoverable** - data.recoverable tells you if it can be fixed
3. **Follow suggestions** - data.suggestion provides specific next steps
4. **Preserve context** - remember what user was trying to do
5. **Retry intelligently** - use backoff for transient errors
6. **Guide users** - explain what went wrong and how to fix it
7. **Offer alternatives** - if operation fails, suggest other options
8. **Never hide errors** - be transparent about what happened
9. **Auto-recover when possible** - retry auth, wait for rate limits
10. **Ask for help when needed** - if you can't recover, ask user

**Common recovery patterns:**

- **Auth errors** → Get new token, retry
- **Not found** → Search and ask user to clarify
- **Validation** → Ask for missing/correct data
- **Rate limit** → Wait and retry
- **Timer conflict** → Offer to stop existing
- **Permission** → Explain limitation, no fix
- **Network** → Retry with backoff
- **Business rule** → Explain constraint, suggest workaround

**User experience tips:**

- Be specific: "duration must be positive" not just "invalid"
- Be helpful: Offer solutions, not just problems
- Be proactive: Validate before calling tools when possible
- Be transparent: Tell user what you're doing ("Retrying in 5 seconds...")
- Be forgiving: Users make typos, help them correct
