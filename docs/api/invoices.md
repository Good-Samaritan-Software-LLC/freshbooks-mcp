# Invoice API Reference

Invoices represent bills sent to clients for goods or services. They contain line items, payment terms, and track payment status.

## invoice_list

List invoices from FreshBooks with optional filtering and pagination.

### Description

Retrieve a paginated list of invoices with filtering by client, status, date range, or other criteria.

**When to use:**
- User asks to see their invoices
- User wants to find invoices by client or status
- User needs to review unpaid or overdue invoices
- Finding invoice IDs for payment recording

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| accountId | string | Yes | - | FreshBooks account identifier |
| page | number | No | 1 | Page number (1-indexed) |
| perPage | number | No | 30 | Results per page (max 100) |
| clientId | number | No | - | Filter by client/customer ID |
| status | string | No | - | Filter by status (draft, sent, viewed, partial, paid, etc.) |
| dateFrom | string | No | - | Filter invoices after date (YYYY-MM-DD) |
| dateTo | string | No | - | Filter invoices before date (YYYY-MM-DD) |

### Input Example

```json
{
  "accountId": "ABC123",
  "page": 1,
  "perPage": 25,
  "clientId": 12345,
  "status": "overdue"
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| invoices | Invoice[] | Array of invoice objects |
| pagination | Pagination | Pagination metadata |

#### Invoice Object

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | number | No | Unique invoice identifier |
| invoiceNumber | string | No | Invoice number (auto-generated or custom) |
| customerId | number | No | Customer/client ID |
| createDate | string | No | Invoice creation date (YYYY-MM-DD) |
| dueDate | string | Yes | Payment due date (YYYY-MM-DD) |
| amount | Money | No | Total invoice amount |
| outstanding | Money | No | Outstanding (unpaid) amount |
| paid | Money | No | Amount paid |
| status | string | No | Invoice status (draft, sent, viewed, partial, paid, etc.) |
| paymentStatus | string | No | Payment status (unpaid, partial, paid, auto_paid) |
| currencyCode | string | No | Currency code (e.g., USD) |
| lines | LineItem[] | No | Invoice line items |
| notes | string | Yes | Invoice notes/memo |
| terms | string | Yes | Payment terms |
| organization | string | Yes | Client organization name |
| fName | string | Yes | Client first name |
| lName | string | Yes | Client last name |
| email | string | Yes | Client email address |
| address | string | Yes | Billing address |
| city | string | Yes | Billing city |
| province | string | Yes | Billing province/state |
| code | string | Yes | Billing postal/zip code |
| country | string | Yes | Billing country |
| visState | number | Yes | Visibility state (0=active, 1=deleted, 2=archived) |
| createdAt | string | Yes | Creation timestamp (ISO 8601) |
| updated | string | Yes | Last update timestamp (ISO 8601) |

#### Money Object

| Field | Type | Description |
|-------|------|-------------|
| amount | string | Decimal amount as string |
| code | string | Currency code (e.g., USD) |

#### LineItem Object

| Field | Type | Description |
|-------|------|-------------|
| name | string | Line item name/title |
| description | string | Line item description |
| qty | number | Quantity |
| amount | Money | Unit price |
| taxName1 | string | First tax name |
| taxAmount1 | Money | First tax amount |
| taxName2 | string | Second tax name |
| taxAmount2 | Money | Second tax amount |

### Output Example

```json
{
  "invoices": [
    {
      "id": 98765,
      "invoiceNumber": "INV-2024-001",
      "customerId": 12345,
      "createDate": "2024-12-01",
      "dueDate": "2024-12-31",
      "amount": {
        "amount": "1500.00",
        "code": "USD"
      },
      "outstanding": {
        "amount": "1500.00",
        "code": "USD"
      },
      "paid": {
        "amount": "0.00",
        "code": "USD"
      },
      "status": "sent",
      "paymentStatus": "unpaid",
      "currencyCode": "USD",
      "lines": [
        {
          "name": "Consulting Services",
          "description": "December 2024 consulting",
          "qty": 10,
          "amount": {
            "amount": "150.00",
            "code": "USD"
          }
        }
      ],
      "notes": "Payment due within 30 days",
      "terms": "Net 30",
      "organization": "Acme Corp",
      "email": "john@acmecorp.com"
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 4,
    "total": 98,
    "perPage": 30
  }
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid accountId format | No | Check account ID is valid |
| -32602 | Invalid status value | No | Use valid status (draft, sent, etc.) |
| -32602 | Invalid date format | No | Use YYYY-MM-DD format |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |
| -32004 | Rate limit exceeded | Yes | Wait and retry after delay |

### Related Tools

- [invoice_single](#invoice_single) - Get single invoice by ID
- [invoice_create](#invoice_create) - Create new invoice
- [client_list](./clients.md#client_list) - Find client IDs
- [payment_list](./payments.md#payment_list) - Find payments for invoices

---

## invoice_single

Get a single invoice by ID.

### Description

Retrieve detailed information about a specific invoice including all line items and payment details.

**When to use:**
- User asks for details about a specific invoice
- Need to verify invoice data before update/delete
- Retrieve full details after creation
- Get invoice for sharing or printing

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| invoiceId | number | Yes | Invoice ID to retrieve |

### Input Example

```json
{
  "accountId": "ABC123",
  "invoiceId": 98765
}
```

### Output Schema

Returns a single Invoice object (see [invoice_list](#invoice-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid invoiceId | No | Check ID is a positive integer |
| -32005 | Invoice not found | No | Verify ID exists in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [invoice_list](#invoice_list) - Find invoice IDs
- [invoice_update](#invoice_update) - Update this invoice
- [invoice_share_link](#invoice_share_link) - Get shareable link
- [payment_create](./payments.md#payment_create) - Record payment

---

## invoice_create

Create a new invoice.

### Description

Create a new invoice with line items, payment terms, and client details. At least one line item is required.

**When to use:**
- User wants to bill a client for services or products
- Creating a new invoice from scratch
- Converting a quote or estimate to an invoice

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| accountId | string | Yes | - | FreshBooks account identifier |
| customerId | number | Yes | - | Customer/client ID |
| lines | LineItem[] | Yes | - | Invoice line items (at least one) |
| createDate | string | No | today | Invoice date (YYYY-MM-DD) |
| dueDate | string | No | - | Payment due date (YYYY-MM-DD) |
| currencyCode | string | No | USD | Currency code |
| notes | string | No | - | Invoice notes/memo |
| terms | string | No | - | Payment terms |
| discount | Money | No | - | Discount to apply |

#### LineItem Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | Yes | - | Line item name (required) |
| description | string | No | - | Line item description |
| qty | number | No | 1 | Quantity |
| unitCost | Money | Yes | - | Unit cost/price |
| taxName1 | string | No | - | First tax name |
| taxAmount1 | string | No | - | First tax percentage |
| taxName2 | string | No | - | Second tax name |
| taxAmount2 | string | No | - | Second tax percentage |

### Input Example

```json
{
  "accountId": "ABC123",
  "customerId": 12345,
  "createDate": "2024-12-15",
  "dueDate": "2025-01-14",
  "currencyCode": "USD",
  "lines": [
    {
      "name": "Web Development",
      "description": "Homepage redesign",
      "qty": 40,
      "unitCost": {
        "amount": "125.00",
        "code": "USD"
      }
    },
    {
      "name": "Hosting Services",
      "description": "Annual hosting",
      "qty": 1,
      "unitCost": {
        "amount": "500.00",
        "code": "USD"
      }
    }
  ],
  "notes": "Thank you for your business!",
  "terms": "Net 30"
}
```

### Output Schema

Returns the created Invoice object (see [invoice_list](#invoice-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Missing customerId | No | Provide valid customer ID |
| -32602 | Empty lines array | No | Provide at least one line item |
| -32602 | Invalid date format | No | Use YYYY-MM-DD format |
| -32013 | Invalid customer ID | Yes | Verify customer exists |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [client_list](./clients.md#client_list) - Find customer IDs
- [invoice_list](#invoice_list) - View created invoices
- [invoice_share_link](#invoice_share_link) - Share invoice with client
- [item_list](./items.md#item_list) - Find items for line items

---

## invoice_update

Update an existing invoice.

### Description

Modify fields of an existing invoice. Only draft invoices can be fully updated. Sent invoices have restrictions.

**When to use:**
- User wants to correct invoice details
- Update line items before sending
- Change payment terms or due date
- Add or modify notes

**Note:** Some fields cannot be updated after invoice is sent. Draft invoices have full update capability.

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| invoiceId | number | Yes | Invoice ID to update |
| customerId | number | No | Customer/client ID |
| createDate | string | No | Invoice date (YYYY-MM-DD) |
| dueDate | string | No | Payment due date (YYYY-MM-DD) |
| currencyCode | string | No | Currency code |
| lines | LineItem[] | No | Invoice line items |
| notes | string | No | Invoice notes/memo |
| terms | string | No | Payment terms |
| discount | Money | No | Discount to apply |

### Input Example

```json
{
  "accountId": "ABC123",
  "invoiceId": 98765,
  "dueDate": "2025-01-31",
  "notes": "Extended payment terms - thank you!"
}
```

### Output Schema

Returns the updated Invoice object (see [invoice_list](#invoice-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid invoiceId | No | Check ID is a positive integer |
| -32005 | Invoice not found | No | Verify ID exists in FreshBooks |
| -32007 | Invoice already paid | No | Cannot update paid invoices |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [invoice_single](#invoice_single) - Get current values before update
- [invoice_delete](#invoice_delete) - Delete instead of update

---

## invoice_delete

Delete an invoice.

### Description

Delete an invoice from FreshBooks. This sets the visibility state to deleted. Only draft invoices can typically be deleted.

**When to use:**
- User wants to remove a draft invoice
- Deleting duplicate invoices
- Removing test/accidental invoices

**Warning:** Only draft invoices can be deleted. Sent invoices should be marked as written off or credited instead.

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| invoiceId | number | Yes | Invoice ID to delete |

### Input Example

```json
{
  "accountId": "ABC123",
  "invoiceId": 98765
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether deletion was successful |
| message | string | Confirmation message |
| invoiceId | number | ID of deleted invoice |

### Output Example

```json
{
  "success": true,
  "message": "Invoice deleted successfully",
  "invoiceId": 98765
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid invoiceId | No | Check ID is a positive integer |
| -32005 | Invoice not found | No | Invoice may already be deleted |
| -32007 | Invoice already sent | No | Cannot delete sent invoices |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [invoice_single](#invoice_single) - Verify invoice before deletion
- [invoice_list](#invoice_list) - View remaining invoices
- [creditnote_create](./credit-notes.md#creditnote_create) - Credit instead of delete

---

## invoice_share_link

Get a shareable link for an invoice.

### Description

Generate a public URL that can be shared with clients to view and pay the invoice online.

**When to use:**
- User wants to share invoice with client
- Need URL for email or messaging
- Client needs to view invoice without login

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| invoiceId | number | Yes | Invoice ID to share |

### Input Example

```json
{
  "accountId": "ABC123",
  "invoiceId": 98765
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| shareLink | string | Public URL for invoice |
| invoiceId | number | Invoice ID |

### Output Example

```json
{
  "shareLink": "https://my.freshbooks.com/invoice/abc123-98765",
  "invoiceId": 98765
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid invoiceId | No | Check ID is a positive integer |
| -32005 | Invoice not found | No | Verify ID exists in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [invoice_single](#invoice_single) - Get invoice details
- [invoice_create](#invoice_create) - Create invoice to share

---

## Notes

### Invoice Status Values

| Status | Description |
|--------|-------------|
| draft | Not yet sent to client |
| sent | Sent to client but not viewed |
| viewed | Client has viewed invoice |
| partial | Partially paid |
| paid | Fully paid |
| auto_paid | Automatically paid via payment gateway |
| retry | Payment retry in progress |
| failed | Payment failed |
| overdue | Past due date and unpaid |
| disputed | Client has disputed invoice |

### Payment Status Values

| Status | Description |
|--------|-------------|
| unpaid | No payment received |
| partial | Partially paid |
| paid | Fully paid |
| auto_paid | Auto-paid via gateway |

### Line Item Calculations

Total line amount = qty × unitCost.amount + taxes

Invoice total = sum of all line items - discounts

### Currency Codes

Invoices use ISO 4217 currency codes (USD, CAD, EUR, GBP, etc.). All line items must use the same currency as the invoice.

### Date Formats

- Invoice dates use YYYY-MM-DD format (e.g., "2024-12-15")
- Timestamps use ISO 8601 format (e.g., "2024-12-15T10:30:00Z")
