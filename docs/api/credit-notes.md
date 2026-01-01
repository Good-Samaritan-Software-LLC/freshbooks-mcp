# Credit Note API Reference

Credit notes represent credits issued to clients for returned items, overpayments, or goodwill adjustments. They reduce the amount owed by clients.

## creditnote_list

List credit notes from FreshBooks with optional filtering and pagination.

### Description

Retrieve a paginated list of credit notes with filtering by client or status.

**When to use:**
- User asks to see credit notes issued
- User wants to find credits for a specific client
- User needs to review credit note history
- Finding credit notes to apply to invoices

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| accountId | string | Yes | - | FreshBooks account identifier |
| page | number | No | 1 | Page number (1-indexed) |
| perPage | number | No | 30 | Results per page (max 100) |
| clientId | number | No | - | Filter by client ID |
| status | string | No | - | Filter by status (created, sent, applied, void) |
| startDate | string | No | - | Filter credits after date (ISO 8601) |
| endDate | string | No | - | Filter credits before date (ISO 8601) |

### Input Example

```json
{
  "accountId": "ABC123",
  "clientId": 12345,
  "status": "applied"
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| creditNotes | CreditNote[] | Array of credit note objects |
| pagination | Pagination | Pagination metadata |

#### CreditNote Object

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | number | No | Unique credit note identifier |
| creditNoteNumber | string | No | Credit note number |
| clientId | number | No | Client receiving credit |
| createDate | string | No | Creation date (ISO 8601) |
| amount | Money | No | Total credit amount |
| currencyCode | string | No | Currency code (e.g., USD) |
| status | string | No | Status (created, sent, applied, void) |
| lines | LineItem[] | Yes | Credit note line items |
| notes | string | Yes | Internal notes |
| terms | string | Yes | Terms and conditions |
| language | string | Yes | Language code |
| displayStatus | string | Yes | Display-friendly status |
| disputeStatus | string | Yes | Dispute status |
| organization | string | Yes | Client organization |
| fName | string | Yes | Client first name |
| lName | string | Yes | Client last name |
| email | string | Yes | Client email |
| address | string | Yes | Client address |
| city | string | Yes | Client city |
| province | string | Yes | Client province/state |
| code | string | Yes | Client postal code |
| country | string | Yes | Client country |
| visState | number | Yes | Visibility state (0=active, 1=deleted) |
| createdAt | string | Yes | Creation timestamp (ISO 8601) |
| updated | string | Yes | Last update timestamp (ISO 8601) |

### Output Example

```json
{
  "creditNotes": [
    {
      "id": 777,
      "creditNoteNumber": "CN-2024-001",
      "clientId": 12345,
      "createDate": "2024-12-15T00:00:00Z",
      "amount": {
        "amount": "500.00",
        "code": "USD"
      },
      "currencyCode": "USD",
      "status": "applied",
      "notes": "Credit for returned items",
      "organization": "Acme Corp",
      "email": "john@acmecorp.com",
      "visState": 0
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 1,
    "total": 8,
    "perPage": 30
  }
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid accountId format | No | Check account ID is valid |
| -32602 | Invalid status value | No | Use valid status |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [creditnote_single](#creditnote_single) - Get single credit note by ID
- [creditnote_create](#creditnote_create) - Create new credit note
- [client_list](./clients.md#client_list) - Find client IDs

---

## creditnote_single

Get a single credit note by ID.

### Description

Retrieve detailed information about a specific credit note.

**When to use:**
- User asks for details about a specific credit note
- Need to verify credit note data
- Retrieve full details after creation

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| creditNoteId | number | Yes | Credit note ID to retrieve |

### Input Example

```json
{
  "accountId": "ABC123",
  "creditNoteId": 777
}
```

### Output Schema

Returns a single CreditNote object (see [creditnote_list](#creditnote-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid creditNoteId | No | Check ID is a positive integer |
| -32005 | Credit note not found | No | Verify ID exists in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [creditnote_list](#creditnote_list) - Find credit note IDs
- [creditnote_update](#creditnote_update) - Update this credit note

---

## creditnote_create

Create a new credit note.

### Description

Issue a credit to a client for returns, adjustments, or overpayments. Credit notes can be applied to invoices.

**When to use:**
- User needs to credit a client for returned items
- Recording a refund or adjustment
- Correcting an invoicing error
- Goodwill credit

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| clientId | number | Yes | Client to credit |
| createDate | string | Yes | Credit note date (ISO 8601) |
| lines | LineItem[] | Yes | Credit note line items (at least one) |
| currencyCode | string | No | Currency code (default: USD) |
| notes | string | No | Internal notes |
| terms | string | No | Terms and conditions |

#### LineItem Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | Line item description |
| description | string | No | Detailed description |
| quantity | number | No | Quantity (default: 1) |
| unitCost | Money | Yes | Unit cost |

### Input Example

```json
{
  "accountId": "ABC123",
  "clientId": 12345,
  "createDate": "2024-12-15T00:00:00Z",
  "currencyCode": "USD",
  "lines": [
    {
      "name": "Product Return Credit",
      "description": "Returned defective items",
      "quantity": 5,
      "unitCost": {
        "amount": "100.00",
        "code": "USD"
      }
    }
  ],
  "notes": "Credit for order #5678 returns"
}
```

### Output Schema

Returns the created CreditNote object (see [creditnote_list](#creditnote-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Missing required fields | No | Provide clientId, createDate, lines |
| -32602 | Empty lines array | No | Provide at least one line item |
| -32013 | Invalid client ID | Yes | Verify client exists |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [client_list](./clients.md#client_list) - Find client IDs
- [creditnote_list](#creditnote_list) - View created credit notes
- [invoice_list](./invoices.md#invoice_list) - Find invoices to apply credit

---

## creditnote_update

Update an existing credit note.

### Description

Modify credit note details. Only unap plied credit notes can typically be updated.

**When to use:**
- User wants to correct credit note details
- Update line items or amounts
- Change notes or terms

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| creditNoteId | number | Yes | Credit note ID to update |
| lines | LineItem[] | No | Credit note line items |
| notes | string | No | Internal notes |
| terms | string | No | Terms and conditions |

### Input Example

```json
{
  "accountId": "ABC123",
  "creditNoteId": 777,
  "notes": "Updated - credit issued per customer service approval"
}
```

### Output Schema

Returns the updated CreditNote object (see [creditnote_list](#creditnote-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid creditNoteId | No | Check ID is a positive integer |
| -32005 | Credit note not found | No | Verify ID exists in FreshBooks |
| -32007 | Credit note already applied | No | Cannot update applied credits |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [creditnote_single](#creditnote_single) - Get current values before update
- [creditnote_delete](#creditnote_delete) - Delete instead of update

---

## creditnote_delete

Delete a credit note.

### Description

Delete a credit note. Only unapplied credit notes can be deleted.

**When to use:**
- User wants to remove incorrect credit note
- Deleting duplicate credit notes
- Removing test entries

**Warning:** Only unapplied credit notes can be deleted.

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| creditNoteId | number | Yes | Credit note ID to delete |

### Input Example

```json
{
  "accountId": "ABC123",
  "creditNoteId": 777
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether deletion was successful |
| message | string | Confirmation message |
| creditNoteId | number | ID of deleted credit note |

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid creditNoteId | No | Check ID is a positive integer |
| -32005 | Credit note not found | No | May already be deleted |
| -32007 | Credit note already applied | No | Cannot delete applied credits |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [creditnote_single](#creditnote_single) - Verify before deletion
- [creditnote_list](#creditnote_list) - View remaining credit notes

---

## Notes

### Credit Note Status Values

| Status | Description |
|--------|-------------|
| created | Created but not sent to client |
| sent | Sent to client |
| applied | Applied to one or more invoices |
| void | Voided/cancelled |

### Applying Credits

Credit notes can be applied to invoices to reduce the amount owed. Once applied, they cannot be modified or deleted.

### vs Refunds

- **Credit Note**: Reduces future invoice amounts
- **Refund**: Returns money already paid

Credit notes are typically used when the client will continue doing business and can use the credit on future purchases.
