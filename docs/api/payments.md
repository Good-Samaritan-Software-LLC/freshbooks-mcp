# Payment API Reference

Payments represent money received from clients for invoices. They track payment method, date, and amount applied to specific invoices.

## payment_list

List payments from FreshBooks with optional filtering and pagination.

### Description

Retrieve a paginated list of payments with filtering by invoice, client, or date range.

**When to use:**
- User asks to see payment history
- User wants to find payments for a specific invoice or client
- User needs to review payments within a date range
- Reconciling accounts receivable

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| accountId | string | Yes | - | FreshBooks account identifier |
| page | number | No | 1 | Page number (1-indexed) |
| perPage | number | No | 30 | Results per page (max 100) |
| invoiceId | number | No | - | Filter by invoice ID |
| clientId | number | No | - | Filter by client ID |
| dateFrom | string | No | - | Filter payments after date (ISO 8601) |
| dateTo | string | No | - | Filter payments before date (ISO 8601) |

### Input Example

```json
{
  "accountId": "ABC123",
  "page": 1,
  "perPage": 25,
  "invoiceId": 98765,
  "dateFrom": "2024-12-01T00:00:00Z"
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| payments | Payment[] | Array of payment objects |
| pagination | Pagination | Pagination metadata |

#### Payment Object

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | number | No | Unique payment identifier |
| invoiceId | number | No | Invoice this payment is applied to |
| accountId | string | No | FreshBooks account ID |
| amount | Money | No | Payment amount |
| date | string | No | Payment date (ISO 8601) |
| type | string | No | Payment method/type |
| note | string | Yes | Payment notes or memo |
| clientId | number | No | Client who made the payment |
| visState | number | Yes | Visibility state (0=active, 1=deleted) |
| logId | number | Yes | Log entry ID |
| updated | string | Yes | Last update timestamp (ISO 8601) |
| creditId | number | Yes | Credit note applied |
| overpaymentId | number | Yes | Overpayment ID if applicable |
| gateway | string | Yes | Payment gateway used |
| fromCredit | boolean | Yes | Whether payment is from credit |
| sendEmailReceipt | boolean | Yes | Whether to send email receipt |

### Output Example

```json
{
  "payments": [
    {
      "id": 55555,
      "invoiceId": 98765,
      "accountId": "ABC123",
      "amount": {
        "amount": "1500.00",
        "code": "USD"
      },
      "date": "2024-12-15T14:30:00Z",
      "type": "Credit Card",
      "note": "Payment via Stripe",
      "clientId": 12345,
      "visState": 0,
      "gateway": "stripe",
      "fromCredit": false,
      "sendEmailReceipt": true
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 2,
    "total": 45,
    "perPage": 30
  }
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid accountId format | No | Check account ID is valid |
| -32602 | Invalid date format | No | Use ISO 8601 format |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |
| -32004 | Rate limit exceeded | Yes | Wait and retry after delay |

### Related Tools

- [payment_single](#payment_single) - Get single payment by ID
- [payment_create](#payment_create) - Record new payment
- [invoice_list](./invoices.md#invoice_list) - Find invoice IDs
- [client_list](./clients.md#client_list) - Find client IDs

---

## payment_single

Get a single payment by ID.

### Description

Retrieve detailed information about a specific payment.

**When to use:**
- User asks for details about a specific payment
- Need to verify payment data before update/delete
- Retrieve full details after creation

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| paymentId | number | Yes | Payment ID to retrieve |

### Input Example

```json
{
  "accountId": "ABC123",
  "paymentId": 55555
}
```

### Output Schema

Returns a single Payment object (see [payment_list](#payment-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid paymentId | No | Check ID is a positive integer |
| -32005 | Payment not found | No | Verify ID exists in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [payment_list](#payment_list) - Find payment IDs
- [payment_update](#payment_update) - Update this payment
- [payment_delete](#payment_delete) - Delete this payment

---

## payment_create

Record a new payment.

### Description

Record a payment received from a client for an invoice. This updates the invoice's paid amount and outstanding balance.

**When to use:**
- User received payment from client
- Recording cash, check, or credit card payment
- Applying payment to an invoice
- Manual payment entry

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| accountId | string | Yes | - | FreshBooks account identifier |
| invoiceId | number | Yes | - | Invoice to apply payment to |
| amount | Money | Yes | - | Payment amount |
| date | string | Yes | - | Payment date (ISO 8601) |
| type | string | No | Cash | Payment method/type |
| note | string | No | - | Payment notes or memo |
| sendEmailReceipt | boolean | No | false | Send receipt to client |

### Input Example

```json
{
  "accountId": "ABC123",
  "invoiceId": 98765,
  "amount": {
    "amount": "1500.00",
    "code": "USD"
  },
  "date": "2024-12-15T14:30:00Z",
  "type": "Credit Card",
  "note": "Payment received via Stripe",
  "sendEmailReceipt": true
}
```

### Output Schema

Returns the created Payment object (see [payment_list](#payment-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Missing invoiceId | No | Provide valid invoice ID |
| -32602 | Missing amount | No | Provide payment amount |
| -32602 | Invalid date format | No | Use ISO 8601 format |
| -32013 | Invalid invoice ID | Yes | Verify invoice exists |
| -32013 | Amount exceeds outstanding | Yes | Check invoice balance |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [invoice_single](./invoices.md#invoice_single) - Check invoice balance
- [payment_list](#payment_list) - View recorded payments
- [invoice_list](./invoices.md#invoice_list) - Find invoice IDs

---

## payment_update

Update an existing payment.

### Description

Modify fields of an existing payment record. Can update amount, date, type, or notes.

**When to use:**
- User wants to correct payment details
- Update payment date or amount
- Change payment method/type
- Add or modify notes

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| paymentId | number | Yes | Payment ID to update |
| amount | Money | No | Payment amount |
| date | string | No | Payment date (ISO 8601) |
| type | string | No | Payment method/type |
| note | string | No | Payment notes or memo |

### Input Example

```json
{
  "accountId": "ABC123",
  "paymentId": 55555,
  "amount": {
    "amount": "1600.00",
    "code": "USD"
  },
  "note": "Updated payment amount - additional tip included"
}
```

### Output Schema

Returns the updated Payment object (see [payment_list](#payment-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid paymentId | No | Check ID is a positive integer |
| -32005 | Payment not found | No | Verify ID exists in FreshBooks |
| -32013 | Amount exceeds outstanding | Yes | Check invoice balance |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [payment_single](#payment_single) - Get current values before update
- [payment_delete](#payment_delete) - Delete instead of update

---

## payment_delete

Delete a payment.

### Description

Delete a payment record from FreshBooks. This removes the payment from the invoice and updates the outstanding balance.

**When to use:**
- User wants to remove incorrect payment
- Deleting duplicate payments
- Payment was reversed or bounced

**Warning:** This updates the invoice's outstanding balance. Ensure this is the desired action.

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| paymentId | number | Yes | Payment ID to delete |

### Input Example

```json
{
  "accountId": "ABC123",
  "paymentId": 55555
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether deletion was successful |
| message | string | Confirmation message |
| paymentId | number | ID of deleted payment |

### Output Example

```json
{
  "success": true,
  "message": "Payment deleted successfully",
  "paymentId": 55555
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid paymentId | No | Check ID is a positive integer |
| -32005 | Payment not found | No | Payment may already be deleted |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [payment_single](#payment_single) - Verify payment before deletion
- [payment_list](#payment_list) - View remaining payments
- [invoice_single](./invoices.md#invoice_single) - Check updated invoice balance

---

## Notes

### Payment Type Values

Common payment types:
- `Check` - Check/cheque payment
- `Credit` - Credit payment
- `Cash` - Cash payment
- `Bank Transfer` - Bank transfer/wire
- `Debit` - Debit card
- `PayPal` - PayPal payment
- `Credit Card` - Credit card
- `Stripe` - Stripe payment
- `ACH` - ACH transfer
- `Wire Transfer` - Wire transfer
- `2Checkout` - 2Checkout gateway
- `Other` - Other payment method

### Payment Application

Payments are applied to specific invoices:
- Payment amount reduces invoice outstanding balance
- When outstanding reaches zero, invoice is marked as paid
- Overpayments can be applied to future invoices

### Email Receipts

When `sendEmailReceipt: true`, FreshBooks automatically emails a payment receipt to the client using the email address on the invoice.

### Date Format

Payment dates use ISO 8601 format with timezone:
- `2024-12-15T14:30:00Z` (UTC)
- `2024-12-15T14:30:00-05:00` (EST)

### Currency

Payment currency must match the invoice currency. The amount is specified as a Money object with amount (string) and currency code.
