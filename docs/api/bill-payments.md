# Bill Payment API Reference

Bill payments represent money paid to vendors for bills. They track payment method, date, and amounts applied to specific bills.

## billpayment_list

List bill payments from FreshBooks with optional filtering and pagination.

### Description

Retrieve a paginated list of bill payments with filtering by bill or date range.

**When to use:**
- User asks to see payment history to vendors
- User wants to find payments for a specific bill
- User needs to review payments within a date range
- Reconciling accounts payable

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| accountId | string | Yes | - | FreshBooks account identifier |
| page | number | No | 1 | Page number (1-indexed) |
| perPage | number | No | 30 | Results per page (max 100) |
| billId | number | No | - | Filter by bill ID |
| startDate | string | No | - | Filter payments after date (ISO 8601) |
| endDate | string | No | - | Filter payments before date (ISO 8601) |

### Input Example

```json
{
  "accountId": "ABC123",
  "billId": 888,
  "startDate": "2024-12-01T00:00:00Z"
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| payments | BillPayment[] | Array of bill payment objects |
| pagination | Pagination | Pagination metadata |

#### BillPayment Object

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | number | No | Unique payment identifier |
| billId | number | No | Associated bill ID |
| amount | Money | No | Payment amount |
| paymentType | string | No | Type of payment (check, credit, cash, etc.) |
| paidDate | string | No | Date payment was made (ISO 8601) |
| note | string | Yes | Payment notes |
| matchedWithExpense | boolean | Yes | Whether matched with expense |
| createdAt | string | No | Creation timestamp (ISO 8601) |
| updatedAt | string | No | Last update timestamp (ISO 8601) |

### Output Example

```json
{
  "payments": [
    {
      "id": 999,
      "billId": 888,
      "amount": {
        "amount": "2500.00",
        "code": "USD"
      },
      "paymentType": "check",
      "paidDate": "2024-12-20T00:00:00Z",
      "note": "Check #1234",
      "matchedWithExpense": false,
      "createdAt": "2024-12-20T10:00:00Z",
      "updatedAt": "2024-12-20T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 1,
    "total": 15,
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

### Related Tools

- [billpayment_single](#billpayment_single) - Get single payment by ID
- [billpayment_create](#billpayment_create) - Record new payment
- [bill_list](./bills.md#bill_list) - Find bill IDs

---

## billpayment_single

Get a single bill payment by ID.

### Description

Retrieve detailed information about a specific bill payment.

**When to use:**
- User asks for details about a specific payment
- Need to verify payment data before update/delete
- Retrieve full details after creation

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| billPaymentId | number | Yes | Bill payment ID to retrieve |

### Input Example

```json
{
  "accountId": "ABC123",
  "billPaymentId": 999
}
```

### Output Schema

Returns a single BillPayment object (see [billpayment_list](#billpayment-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid billPaymentId | No | Check ID is a positive integer |
| -32005 | Payment not found | No | Verify ID exists in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [billpayment_list](#billpayment_list) - Find payment IDs
- [billpayment_update](#billpayment_update) - Update this payment
- [billpayment_delete](#billpayment_delete) - Delete this payment

---

## billpayment_create

Record a new bill payment.

### Description

Record a payment made to a vendor for a bill. This updates the bill's paid amount and outstanding balance.

**When to use:**
- User paid a vendor bill
- Recording check, ACH, or wire transfer payment
- Manual payment entry

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| billId | number | Yes | Bill to apply payment to |
| amount | Money | Yes | Payment amount |
| paymentType | string | Yes | Payment method (check, credit, cash, bank_transfer, debit, other) |
| paidDate | string | Yes | Date payment was made (ISO 8601) |
| note | string | No | Payment notes |

### Input Example

```json
{
  "accountId": "ABC123",
  "billId": 888,
  "amount": {
    "amount": "2500.00",
    "code": "USD"
  },
  "paymentType": "check",
  "paidDate": "2024-12-20T00:00:00Z",
  "note": "Check #1234 - Office equipment payment"
}
```

### Output Schema

Returns the created BillPayment object (see [billpayment_list](#billpayment-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Missing required fields | No | Provide billId, amount, paymentType, paidDate |
| -32602 | Invalid paymentType | No | Use valid type (check, credit, cash, etc.) |
| -32013 | Invalid bill ID | Yes | Verify bill exists |
| -32013 | Amount exceeds outstanding | Yes | Check bill balance |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [bill_single](./bills.md#bill_single) - Check bill balance
- [billpayment_list](#billpayment_list) - View recorded payments

---

## billpayment_update

Update an existing bill payment.

### Description

Modify fields of an existing bill payment record.

**When to use:**
- User wants to correct payment details
- Update payment amount or date
- Change payment method/type
- Add or modify notes

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| billPaymentId | number | Yes | Payment ID to update |
| amount | Money | No | Payment amount |
| paymentType | string | No | Payment method |
| paidDate | string | No | Date payment was made (ISO 8601) |
| note | string | No | Payment notes |

### Input Example

```json
{
  "accountId": "ABC123",
  "billPaymentId": 999,
  "note": "Check #1234 - Cleared on 12/22/2024"
}
```

### Output Schema

Returns the updated BillPayment object (see [billpayment_list](#billpayment-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid billPaymentId | No | Check ID is a positive integer |
| -32005 | Payment not found | No | Verify ID exists in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [billpayment_single](#billpayment_single) - Get current values before update
- [billpayment_delete](#billpayment_delete) - Delete instead of update

---

## billpayment_delete

Delete a bill payment.

### Description

Delete a bill payment record. This removes the payment from the bill and updates the outstanding balance.

**When to use:**
- User wants to remove incorrect payment
- Deleting duplicate payments
- Payment was reversed or bounced

**Warning:** This updates the bill's outstanding balance.

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| billPaymentId | number | Yes | Payment ID to delete |

### Input Example

```json
{
  "accountId": "ABC123",
  "billPaymentId": 999
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether deletion was successful |
| message | string | Confirmation message |
| billPaymentId | number | ID of deleted payment |

### Output Example

```json
{
  "success": true,
  "message": "Bill payment deleted successfully",
  "billPaymentId": 999
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid billPaymentId | No | Check ID is a positive integer |
| -32005 | Payment not found | No | Payment may already be deleted |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [billpayment_single](#billpayment_single) - Verify payment before deletion
- [billpayment_list](#billpayment_list) - View remaining payments
- [bill_single](./bills.md#bill_single) - Check updated bill balance

---

## Notes

### Payment Type Values

| Type | Description |
|------|-------------|
| check | Check/cheque payment |
| credit | Credit payment |
| cash | Cash payment |
| bank_transfer | Bank transfer/wire |
| debit | Debit card |
| other | Other payment method |

### Payment Application

Bill payments are applied to specific bills:
- Payment amount reduces bill outstanding balance
- When outstanding reaches zero, bill is marked as paid
- Multiple payments can be applied to a single bill

### Date Format

Payment dates use ISO 8601 format with timezone:
- `2024-12-20T00:00:00Z` (UTC)
- `2024-12-20T14:30:00-05:00` (EST)

### Matching with Expenses

Bill payments can be matched with expense records for better tracking and reconciliation.
