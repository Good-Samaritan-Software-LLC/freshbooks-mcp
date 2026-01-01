# Expense API Reference

Expenses represent business costs that can be tracked for tax purposes, billed to clients, or included in financial reports.

## expense_list

List expenses from FreshBooks with optional filtering and pagination.

### Description

Retrieve a paginated list of expenses with filtering by category, client, project, vendor, or date range.

**When to use:**
- User asks to see expense records
- User wants to find expenses by category or vendor
- User needs to review billable expenses for a client
- Finding expenses within a date range for reporting

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| accountId | string | Yes | - | FreshBooks account identifier |
| page | number | No | 1 | Page number (1-indexed) |
| perPage | number | No | 30 | Results per page (max 100) |
| categoryId | number | No | - | Filter by expense category ID |
| clientId | number | No | - | Filter by client ID |
| projectId | number | No | - | Filter by project ID |
| vendor | string | No | - | Filter by vendor name (partial match) |
| dateFrom | string | No | - | Filter expenses after date (ISO 8601) |
| dateTo | string | No | - | Filter expenses before date (ISO 8601) |
| status | string | No | - | Filter by status (outstanding, invoiced, partial, paid) |

### Input Example

```json
{
  "accountId": "ABC123",
  "page": 1,
  "perPage": 25,
  "categoryId": 5,
  "clientId": 12345,
  "dateFrom": "2024-12-01T00:00:00Z",
  "dateTo": "2024-12-31T23:59:59Z"
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| expenses | Expense[] | Array of expense objects |
| pagination | Pagination | Pagination metadata |

#### Expense Object

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | number | No | Unique expense identifier |
| expenseId | number | Yes | Expense ID (alternate field) |
| categoryId | number | No | Expense category ID |
| staffId | number | No | Staff member who incurred expense |
| date | string | No | Expense date (ISO 8601) |
| amount | Money | No | Expense amount with currency |
| vendor | string | Yes | Vendor name |
| notes | string | No | Expense notes/description |
| clientId | number | Yes | Client to bill for expense |
| projectId | number | Yes | Associated project ID |
| invoiceId | number | Yes | Invoice ID if expense has been billed |
| status | string | Yes | Expense status (outstanding, invoiced, partial, paid) |
| hasReceipt | boolean | Yes | Whether a receipt is attached |
| markupPercent | number | Yes | Markup percentage for billing |
| taxName1 | string | Yes | First tax name |
| taxPercent1 | string | Yes | First tax percentage |
| taxAmount1 | Money | Yes | First tax amount |
| taxName2 | string | Yes | Second tax name |
| taxPercent2 | string | Yes | Second tax percentage |
| taxAmount2 | Money | Yes | Second tax amount |
| visState | number | Yes | Visibility state (0=active, 1=deleted, 2=archived) |
| updated | string | Yes | Last update timestamp (ISO 8601) |

### Output Example

```json
{
  "expenses": [
    {
      "id": 77777,
      "categoryId": 5,
      "staffId": 1,
      "date": "2024-12-10T00:00:00Z",
      "amount": {
        "amount": "125.50",
        "code": "USD"
      },
      "vendor": "Office Supply Co",
      "notes": "Printer cartridges for office",
      "clientId": 12345,
      "projectId": 42,
      "invoiceId": null,
      "status": "outstanding",
      "hasReceipt": true,
      "markupPercent": 10,
      "visState": 0
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 3,
    "total": 78,
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

- [expense_single](#expense_single) - Get single expense by ID
- [expense_create](#expense_create) - Record new expense
- [expensecategory_list](./expense-categories.md#expensecategory_list) - Find category IDs
- [client_list](./clients.md#client_list) - Find client IDs

---

## expense_single

Get a single expense by ID.

### Description

Retrieve detailed information about a specific expense.

**When to use:**
- User asks for details about a specific expense
- Need to verify expense data before update/delete
- Retrieve full details after creation

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| expenseId | number | Yes | Expense ID to retrieve |

### Input Example

```json
{
  "accountId": "ABC123",
  "expenseId": 77777
}
```

### Output Schema

Returns a single Expense object (see [expense_list](#expense-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid expenseId | No | Check ID is a positive integer |
| -32005 | Expense not found | No | Verify ID exists in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [expense_list](#expense_list) - Find expense IDs
- [expense_update](#expense_update) - Update this expense
- [expense_delete](#expense_delete) - Delete this expense

---

## expense_create

Record a new expense.

### Description

Create a new expense record. Can be billable to a client or internal only.

**When to use:**
- User wants to record a business expense
- Tracking costs for tax purposes
- Recording billable expenses for client invoicing
- Logging vendor purchases

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| categoryId | number | Yes | Expense category ID |
| staffId | number | Yes | Staff member ID who incurred expense |
| date | string | Yes | Expense date (ISO 8601) |
| amount | Money | Yes | Expense amount with currency |
| vendor | string | No | Vendor name |
| notes | string | No | Expense notes/description |
| clientId | number | No | Client to bill (makes expense billable) |
| projectId | number | No | Associated project |
| markupPercent | number | No | Markup percentage (0-100) |
| taxName1 | string | No | First tax name |
| taxPercent1 | string | No | First tax percentage |
| taxName2 | string | No | Second tax name |
| taxPercent2 | string | No | Second tax percentage |

### Input Example

```json
{
  "accountId": "ABC123",
  "categoryId": 5,
  "staffId": 1,
  "date": "2024-12-15T00:00:00Z",
  "amount": {
    "amount": "89.99",
    "code": "USD"
  },
  "vendor": "Tech Store",
  "notes": "USB cables for client project",
  "clientId": 12345,
  "projectId": 42,
  "markupPercent": 15
}
```

### Output Schema

Returns the created Expense object (see [expense_list](#expense-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Missing required fields | No | Provide categoryId, staffId, date, amount |
| -32602 | Invalid markupPercent | No | Use 0-100 |
| -32013 | Invalid category/client/project ID | Yes | Verify IDs exist |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [expensecategory_list](./expense-categories.md#expensecategory_list) - Find category IDs
- [user_me](./users.md#user_me) - Get current staff ID
- [expense_list](#expense_list) - View recorded expenses

---

## expense_update

Update an existing expense.

### Description

Modify fields of an existing expense. Cannot update expenses that have been invoiced.

**When to use:**
- User wants to correct expense details
- Update amount, vendor, or category
- Add client or project association
- Change billing markup

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| expenseId | number | Yes | Expense ID to update |
| categoryId | number | No | Expense category ID |
| date | string | No | Expense date (ISO 8601) |
| amount | Money | No | Expense amount with currency |
| vendor | string | No | Vendor name |
| notes | string | No | Expense notes/description |
| clientId | number | No | Client to bill |
| projectId | number | No | Associated project |
| markupPercent | number | No | Markup percentage (0-100) |
| taxName1 | string | No | First tax name |
| taxPercent1 | string | No | First tax percentage |
| taxName2 | string | No | Second tax name |
| taxPercent2 | string | No | Second tax percentage |
| visState | number | No | Visibility state (0/1/2) |

### Input Example

```json
{
  "accountId": "ABC123",
  "expenseId": 77777,
  "amount": {
    "amount": "95.00",
    "code": "USD"
  },
  "notes": "Updated - included tax in amount"
}
```

### Output Schema

Returns the updated Expense object (see [expense_list](#expense-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid expenseId | No | Check ID is a positive integer |
| -32005 | Expense not found | No | Verify ID exists in FreshBooks |
| -32007 | Expense already invoiced | No | Cannot update invoiced expenses |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [expense_single](#expense_single) - Get current values before update
- [expense_delete](#expense_delete) - Delete instead of update

---

## expense_delete

Delete an expense.

### Description

Delete an expense record from FreshBooks. Cannot delete expenses that have been invoiced.

**When to use:**
- User wants to remove incorrect expense
- Deleting duplicate expenses
- Removing test or accidental entries

**Warning:** Cannot delete expenses that have been invoiced to clients.

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| expenseId | number | Yes | Expense ID to delete |

### Input Example

```json
{
  "accountId": "ABC123",
  "expenseId": 77777
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether deletion was successful |
| message | string | Confirmation message |
| expenseId | number | ID of deleted expense |

### Output Example

```json
{
  "success": true,
  "message": "Expense deleted successfully",
  "expenseId": 77777
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid expenseId | No | Check ID is a positive integer |
| -32005 | Expense not found | No | Expense may already be deleted |
| -32007 | Expense already invoiced | No | Cannot delete invoiced expenses |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [expense_single](#expense_single) - Verify expense before deletion
- [expense_list](#expense_list) - View remaining expenses

---

## Notes

### Expense Status Values

| Status | Description |
|--------|-------------|
| outstanding | Not yet invoiced or paid |
| invoiced | Included on an invoice to client |
| partial | Partially paid/reimbursed |
| paid | Fully paid/reimbursed |

### Billable Expenses

To make an expense billable to a client:
1. Set `clientId` when creating/updating
2. Optionally set `projectId` for project tracking
3. Set `markupPercent` to add markup (e.g., 10 for 10%)

### Markup Calculation

If expense is $100 with 10% markup:
- Cost: $100.00
- Markup: $10.00 (10%)
- Client billed: $110.00

### Date Format

Expense dates use ISO 8601 format:
- `2024-12-15T00:00:00Z` (UTC)
- `2024-12-15T14:30:00-05:00` (EST)
