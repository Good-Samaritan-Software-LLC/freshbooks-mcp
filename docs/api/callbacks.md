# Callback (Webhook) API Reference

Callbacks (webhooks) allow you to receive real-time notifications when events occur in FreshBooks (e.g., invoice created, payment received).

## callback_list

List configured webhooks.

### Description

Retrieve a list of all webhooks configured for your FreshBooks account.

**When to use:**
- User wants to see configured webhooks
- User needs to review event subscriptions
- Managing webhook configurations

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| accountId | string | Yes | - | FreshBooks account identifier |
| page | number | No | 1 | Page number (1-indexed) |
| perPage | number | No | 30 | Results per page (max 100) |

### Input Example

```json
{
  "accountId": "ABC123"
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| callbacks | Callback[] | Array of webhook objects |
| pagination | Pagination | Pagination metadata |

#### Callback Object

| Field | Type | Description |
|-------|------|-------------|
| id | number | Unique callback identifier |
| event | string | Event type being monitored |
| uri | string | Webhook endpoint URL |
| verified | boolean | Whether webhook ownership has been verified |
| createdAt | string | Creation timestamp (ISO 8601) |
| updatedAt | string | Last update timestamp (ISO 8601) |

### Output Example

```json
{
  "callbacks": [
    {
      "id": 123,
      "event": "invoice.create",
      "uri": "https://myapp.com/webhooks/freshbooks",
      "verified": true,
      "createdAt": "2024-11-15T10:00:00Z",
      "updatedAt": "2024-11-15T10:00:00Z"
    },
    {
      "id": 124,
      "event": "payment.create",
      "uri": "https://myapp.com/webhooks/freshbooks",
      "verified": true,
      "createdAt": "2024-11-15T10:05:00Z",
      "updatedAt": "2024-11-15T10:05:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 1,
    "total": 2,
    "perPage": 30
  }
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid accountId format | No | Check account ID is valid |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [callback_single](#callback_single) - Get single webhook by ID
- [callback_create](#callback_create) - Create new webhook
- [callback_verify](#callback_verify) - Verify webhook ownership

---

## callback_single

Get a single webhook by ID.

### Description

Retrieve detailed information about a specific webhook.

**When to use:**
- User asks for details about a specific webhook
- Need to check webhook verification status
- Retrieve webhook configuration

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| callbackId | number | Yes | Callback ID to retrieve |

### Input Example

```json
{
  "accountId": "ABC123",
  "callbackId": 123
}
```

### Output Schema

Returns a single Callback object (see [callback_list](#callback-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid callbackId | No | Check ID is a positive integer |
| -32005 | Callback not found | No | Verify ID exists in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [callback_list](#callback_list) - Find callback IDs
- [callback_verify](#callback_verify) - Verify this webhook
- [callback_delete](#callback_delete) - Delete this webhook

---

## callback_create

Create a new webhook.

### Description

Register a new webhook to receive notifications when specific events occur in FreshBooks.

**When to use:**
- User wants to integrate FreshBooks with external system
- User needs real-time event notifications
- Building automated workflows

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| event | string | Yes | Event type to listen for |
| uri | string | Yes | Your webhook endpoint URL (HTTPS, publicly accessible) |

### Input Example

```json
{
  "accountId": "ABC123",
  "event": "invoice.create",
  "uri": "https://myapp.com/webhooks/freshbooks"
}
```

### Output Schema

Returns the created Callback object (see [callback_list](#callback-object) for schema).

**Note:** Webhook will be unverified initially. Use [callback_verify](#callback_verify) to complete setup.

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid URI format | No | Provide valid HTTPS URL |
| -32602 | Invalid event type | No | Use valid event type |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [callback_verify](#callback_verify) - Verify webhook after creation
- [callback_resend_verification](#callback_resend_verification) - Resend verification code

---

## callback_update

Update an existing webhook.

### Description

Modify webhook event type or endpoint URL.

**When to use:**
- User wants to change webhook URL
- User needs to listen to different event
- Updating webhook configuration

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| callbackId | number | Yes | Callback ID to update |
| event | string | No | Event type to listen for |
| uri | string | No | Webhook endpoint URL |

### Input Example

```json
{
  "accountId": "ABC123",
  "callbackId": 123,
  "uri": "https://myapp.com/webhooks/freshbooks-v2"
}
```

### Output Schema

Returns the updated Callback object (see [callback_list](#callback-object) for schema).

**Note:** Changing URI requires re-verification.

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid callbackId | No | Check ID is a positive integer |
| -32005 | Callback not found | No | Verify ID exists in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [callback_single](#callback_single) - Get current values before update
- [callback_verify](#callback_verify) - Verify after URI change

---

## callback_delete

Delete a webhook.

### Description

Remove a webhook subscription to stop receiving event notifications.

**When to use:**
- User no longer needs webhook notifications
- User is removing integration
- Cleaning up unused webhooks

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| callbackId | number | Yes | Callback ID to delete |

### Input Example

```json
{
  "accountId": "ABC123",
  "callbackId": 123
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether deletion was successful |
| callbackId | number | ID of deleted callback |

### Output Example

```json
{
  "success": true,
  "callbackId": 123
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid callbackId | No | Check ID is a positive integer |
| -32005 | Callback not found | No | May already be deleted |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [callback_single](#callback_single) - Verify before deletion
- [callback_list](#callback_list) - View remaining webhooks

---

## callback_verify

Verify webhook ownership.

### Description

Verify that you own the webhook endpoint by providing the verification code sent to your endpoint.

**When to use:**
- After creating a new webhook
- After changing webhook URI
- Completing webhook setup

**Process:**
1. Create webhook with `callback_create`
2. FreshBooks sends verification code to your endpoint
3. Call `callback_verify` with the verification code
4. Webhook becomes verified and starts receiving events

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| callbackId | number | Yes | Callback ID to verify |
| verifier | string | Yes | Verification code received at your endpoint |

### Input Example

```json
{
  "accountId": "ABC123",
  "callbackId": 123,
  "verifier": "abc123xyz789"
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether verification was successful |
| verified | boolean | Whether webhook is now verified |

### Output Example

```json
{
  "success": true,
  "verified": true
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid verifier code | Yes | Use correct verification code |
| -32005 | Callback not found | No | Verify callback ID |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [callback_create](#callback_create) - Create webhook first
- [callback_resend_verification](#callback_resend_verification) - Resend if code lost

---

## callback_resend_verification

Resend verification code to webhook endpoint.

### Description

Request FreshBooks to resend the verification code to your webhook endpoint.

**When to use:**
- User lost or didn't receive original verification code
- Verification code expired
- Need to retry verification

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| callbackId | number | Yes | Callback ID to resend verification for |

### Input Example

```json
{
  "accountId": "ABC123",
  "callbackId": 123
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether resend was successful |
| message | string | Confirmation message |

### Output Example

```json
{
  "success": true,
  "message": "Verification code resent to webhook endpoint"
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32005 | Callback not found | No | Verify callback ID |
| -32007 | Already verified | No | Webhook already verified |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [callback_verify](#callback_verify) - Verify with received code
- [callback_single](#callback_single) - Check verification status

---

## Notes

### Available Events

Common webhook events:
- `invoice.create` - New invoice created
- `invoice.update` - Invoice modified
- `invoice.delete` - Invoice deleted
- `payment.create` - Payment received
- `payment.update` - Payment modified
- `payment.delete` - Payment deleted
- `time_entry.create` - Time entry logged
- `time_entry.update` - Time entry modified
- `expense.create` - Expense recorded
- `client.create` - New client added

### Webhook Payload

When events occur, FreshBooks sends POST request to your URI:
```json
{
  "event": "invoice.create",
  "objectId": 12345,
  "accountId": "ABC123",
  "occurredAt": "2024-12-21T10:00:00Z"
}
```

### Endpoint Requirements

Your webhook endpoint must:
- Use HTTPS (not HTTP)
- Be publicly accessible
- Respond with 200-299 status code
- Respond within 10 seconds

### Verification Process

1. Create webhook → FreshBooks sends POST with verification code
2. Extract `verifier` from the POST body
3. Call `callback_verify` with the verifier
4. Webhook is verified and active

### Security

- Use HTTPS only
- Validate incoming webhook signatures
- Store webhook secrets securely
- Verify source IP if possible

### Testing

Use tools like ngrok to expose local development servers for webhook testing.
