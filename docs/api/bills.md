# Bill API Reference

Bills represent expenses you owe to vendors/suppliers. They track amounts owed, due dates, and payment status for accounts payable management.

## bill_list

List bills from FreshBooks with optional filtering and pagination.

### Description

Retrieve a paginated list of bills with filtering by vendor, status, or date range.

**When to use:**
- User asks to see bills owed to vendors
- User wants to find unpaid or overdue bills
- User needs to review bills for a specific vendor
- Managing accounts payable

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| accountId | string | Yes | - | FreshBooks account identifier |
| page | number | No | 1 | Page number (1-indexed) |
| perPage | number | No | 30 | Results per page (max 100) |
| vendorId | number | No | - | Filter by vendor ID |
| status | string | No | - | Filter by status (unpaid, partial, paid, overdue) |
| startDate | string | No | - | Filter bills after date (ISO 8601) |
| endDate | string | No | - | Filter bills before date (ISO 8601) |

### Input Example

```json
{
  "accountId": "ABC123",
  "vendorId": 555,
  "status": "unpaid",
  "startDate": "2024-12-01T00:00:00Z"
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| bills | Bill[] | Array of bill objects |
| pagination | Pagination | Pagination metadata |

#### Bill Object

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | number | No | Unique bill identifier |
| billNumber | string | Yes | Bill/invoice number from vendor |
| vendorId | number | No | Vendor ID |
| amount | Money | No | Bill total amount |
| outstandingAmount | Money | Yes | Outstanding amount |
| paidAmount | Money | Yes | Amount paid |
| dueDate | string | Yes | Payment due date (ISO 8601) |
| issueDate | string | No | Bill issue date (ISO 8601) |
| status | string | No | Bill status (unpaid, partial, paid, overdue) |
| lines | array | No | Bill line items |
| notes | string | Yes | Bill notes |
| attachment | any | Yes | Attached document/receipt |
| taxAmount | Money | Yes | Total tax amount |
| createdAt | string | No | Creation timestamp (ISO 8601) |
| updatedAt | string | No | Last update timestamp (ISO 8601) |
| visState | number | Yes | Visibility state (0=active, 1=deleted, 2=archived) |

### Output Example

```json
{
  "bills": [
    {
      "id": 888,
      "billNumber": "INV-2024-5678",
      "vendorId": 555,
      "amount": {
        "amount": "2500.00",
        "code": "USD"
      },
      "outstandingAmount": {
        "amount": "2500.00",
        "code": "USD"
      },
      "paidAmount": {
        "amount": "0.00",
        "code": "USD"
      },
      "dueDate": "2025-01-15T00:00:00Z",
      "issueDate": "2024-12-15T00:00:00Z",
      "status": "unpaid",
      "notes": "Office equipment purchase",
      "visState": 0
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 2,
    "total": 42,
    "perPage": 30
  }
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid accountId format | No | Check account ID is valid |
| -32602 | Invalid status value | No | Use valid status (unpaid, partial, paid, overdue) |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [bill_single](#bill_single) - Get single bill by ID
- [bill_create](#bill_create) - Create new bill
- [billvendor_list](./bill-vendors.md#billvendor_list) - Find vendor IDs
- [billpayment_create](./bill-payments.md#billpayment_create) - Record payment

---

## bill_single

Get a single bill by ID.

### Description

Retrieve detailed information about a specific bill including line items and payment status.

**When to use:**
- User asks for details about a specific bill
- Need to verify bill data before payment
- Retrieve full details after creation

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| billId | number | Yes | Bill ID to retrieve |

### Input Example

```json
{
  "accountId": "ABC123",
  "billId": 888
}
```

### Output Schema

Returns a single Bill object (see [bill_list](#bill-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid billId | No | Check ID is a positive integer |
| -32005 | Bill not found | No | Verify ID exists in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [bill_list](#bill_list) - Find bill IDs
- [billpayment_create](./bill-payments.md#billpayment_create) - Pay this bill
- [bill_delete](#bill_delete) - Delete this bill

---

## bill_create

Create a new bill.

### Description

Record a bill received from a vendor for goods or services purchased.

**When to use:**
- User received a bill/invoice from vendor
- Recording accounts payable
- Tracking money owed to suppliers

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| vendorId | number | Yes | Vendor ID (required) |
| issueDate | string | Yes | Bill issue date (ISO 8601) |
| amount | Money | Yes | Bill total amount |
| dueDate | string | No | Payment due date (ISO 8601) |
| billNumber | string | No | Bill/invoice number from vendor |
| lines | array | No | Bill line items |
| notes | string | No | Bill notes |
| attachment | any | No | Attached document/receipt |

### Input Example

```json
{
  "accountId": "ABC123",
  "vendorId": 555,
  "issueDate": "2024-12-15T00:00:00Z",
  "dueDate": "2025-01-15T00:00:00Z",
  "billNumber": "INV-5678",
  "amount": {
    "amount": "2500.00",
    "code": "USD"
  },
  "notes": "Office equipment - 10 laptops"
}
```

### Output Schema

Returns the created Bill object (see [bill_list](#bill-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Missing required fields | No | Provide vendorId, issueDate, amount |
| -32013 | Invalid vendor ID | Yes | Verify vendor exists |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [billvendor_list](./bill-vendors.md#billvendor_list) - Find vendor IDs
- [bill_list](#bill_list) - View created bills
- [billpayment_create](./bill-payments.md#billpayment_create) - Pay bill

---

## bill_delete

Delete a bill.

### Description

Delete a bill record. Only unpaid bills can typically be deleted.

**When to use:**
- User wants to remove incorrect bill
- Deleting duplicate bills
- Removing test entries

**Warning:** Only unpaid bills can be deleted. Paid bills should be handled differently.

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| billId | number | Yes | Bill ID to delete |

### Input Example

```json
{
  "accountId": "ABC123",
  "billId": 888
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether deletion was successful |
| message | string | Confirmation message |
| billId | number | ID of deleted bill |

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid billId | No | Check ID is a positive integer |
| -32005 | Bill not found | No | Bill may already be deleted |
| -32007 | Bill already paid | No | Cannot delete paid bills |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [bill_single](#bill_single) - Verify bill before deletion
- [bill_archive](#bill_archive) - Archive instead of delete

---

## bill_archive

Archive a bill.

### Description

Archive a bill to remove it from active view while preserving the record.

**When to use:**
- User wants to hide old bills
- Organizing accounts payable
- Preserving bill history without deleting

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| billId | number | Yes | Bill ID to archive |

### Input Example

```json
{
  "accountId": "ABC123",
  "billId": 888
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether archiving was successful |
| message | string | Confirmation message |
| billId | number | ID of archived bill |

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid billId | No | Check ID is a positive integer |
| -32005 | Bill not found | No | Verify ID exists in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [bill_single](#bill_single) - Verify bill before archiving
- [bill_list](#bill_list) - Filter to show archived bills

---

## Notes

### Bill Status Values

| Status | Description |
|--------|-------------|
| unpaid | No payment received |
| partial | Partially paid |
| paid | Fully paid |
| overdue | Past due date and unpaid |

### Due Dates

Bills with past due dates automatically show as "overdue" status when unpaid.

### Vendor Bills vs Client Invoices

- **Bills** - Money you owe to vendors (accounts payable)
- **Invoices** - Money clients owe you (accounts receivable)

### Attachments

You can attach receipts or vendor invoices as documentation for bills. This helps with record-keeping and audit trails.
