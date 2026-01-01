# Other Income API Reference

Other income represents revenue from sources other than standard invoicing (e.g., interest, grants, investment income, one-time payments).

## otherincome_list

List other income records from FreshBooks with optional filtering and pagination.

### Description

Retrieve a paginated list of other income records with filtering by category or date range.

**When to use:**
- User asks to see non-invoice income
- User wants to review income by category
- User needs to find income within a date range
- Financial reporting for all revenue sources

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| accountId | string | Yes | - | FreshBooks account identifier |
| page | number | No | 1 | Page number (1-indexed) |
| perPage | number | No | 30 | Results per page (max 100) |
| categoryName | string | No | - | Filter by category name |
| dateFrom | string | No | - | Filter income after date (ISO 8601) |
| dateTo | string | No | - | Filter income before date (ISO 8601) |

### Input Example

```json
{
  "accountId": "ABC123",
  "categoryName": "Interest Income",
  "dateFrom": "2024-01-01T00:00:00Z",
  "dateTo": "2024-12-31T23:59:59Z"
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| otherIncome | OtherIncome[] | Array of other income objects |
| pagination | Pagination | Pagination metadata |

#### OtherIncome Object

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| incomeId | number | No | Unique income identifier |
| amount | Money | No | Income amount |
| categoryName | string | No | Income category name |
| createdAt | string | No | Creation timestamp (ISO 8601) |
| date | string | No | Income date (ISO 8601) |
| note | string | Yes | Income notes or description |
| paymentType | string | No | Payment method received |
| source | string | Yes | Income source |
| taxes | Tax[] | Yes | Applied taxes |
| updated | string | Yes | Last update timestamp (ISO 8601) |
| visState | number | Yes | Visibility state (0=active, 1=deleted) |

### Output Example

```json
{
  "otherIncome": [
    {
      "incomeId": 333,
      "amount": {
        "amount": "250.00",
        "code": "USD"
      },
      "categoryName": "Interest Income",
      "createdAt": "2024-12-01T10:00:00Z",
      "date": "2024-12-01T00:00:00Z",
      "note": "Quarterly interest from business savings",
      "paymentType": "Bank Transfer",
      "source": "First National Bank",
      "visState": 0
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 1,
    "total": 12,
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

- [otherincome_single](#otherincome_single) - Get single income record by ID
- [otherincome_create](#otherincome_create) - Record new income
- [report_profit_loss](./reports.md#report_profit_loss) - View in P&L report

---

## otherincome_single

Get a single other income record by ID.

### Description

Retrieve detailed information about a specific other income record.

**When to use:**
- User asks for details about specific income
- Need to verify income data before update/delete
- Retrieve full details after creation

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| incomeId | number | Yes | Income ID to retrieve |

### Input Example

```json
{
  "accountId": "ABC123",
  "incomeId": 333
}
```

### Output Schema

Returns a single OtherIncome object (see [otherincome_list](#otherincome-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid incomeId | No | Check ID is a positive integer |
| -32005 | Income not found | No | Verify ID exists in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [otherincome_list](#otherincome_list) - Find income IDs
- [otherincome_update](#otherincome_update) - Update this income
- [otherincome_delete](#otherincome_delete) - Delete this income

---

## otherincome_create

Record new other income.

### Description

Record income from non-invoice sources such as interest, grants, or one-time payments.

**When to use:**
- User received income not from client invoices
- Recording interest, dividends, or investment income
- Logging grants or subsidies
- One-time payments or miscellaneous income

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| accountId | string | Yes | - | FreshBooks account identifier |
| amount | Money | Yes | - | Income amount |
| categoryName | string | Yes | - | Income category name |
| date | string | Yes | - | Income date (ISO 8601) |
| paymentType | string | No | Cash | Payment method received |
| note | string | No | - | Income notes or description |
| source | string | No | - | Income source |
| taxes | Tax[] | No | - | Taxes to apply |

### Input Example

```json
{
  "accountId": "ABC123",
  "amount": {
    "amount": "1500.00",
    "code": "USD"
  },
  "categoryName": "Grant Income",
  "date": "2024-12-15T00:00:00Z",
  "paymentType": "Bank Transfer",
  "note": "Small business development grant - Q4 2024",
  "source": "State Economic Development Agency"
}
```

### Output Schema

Returns the created OtherIncome object (see [otherincome_list](#otherincome-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Missing required fields | No | Provide amount, categoryName, date |
| -32602 | Invalid paymentType | No | Use valid payment type |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [otherincome_list](#otherincome_list) - View recorded income
- [report_profit_loss](./reports.md#report_profit_loss) - Include in financial reports

---

## otherincome_update

Update an existing other income record.

### Description

Modify details of an existing other income record.

**When to use:**
- User wants to correct income details
- Update amount, category, or date
- Add or modify notes
- Change payment type or source

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| incomeId | number | Yes | Income ID to update |
| amount | Money | No | Income amount |
| categoryName | string | No | Income category name |
| date | string | No | Income date (ISO 8601) |
| paymentType | string | No | Payment method received |
| note | string | No | Income notes or description |
| source | string | No | Income source |
| taxes | Tax[] | No | Taxes to apply |

### Input Example

```json
{
  "accountId": "ABC123",
  "incomeId": 333,
  "amount": {
    "amount": "1750.00",
    "code": "USD"
  },
  "note": "Updated grant amount after amendment"
}
```

### Output Schema

Returns the updated OtherIncome object (see [otherincome_list](#otherincome-object) for schema).

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid incomeId | No | Check ID is a positive integer |
| -32005 | Income not found | No | Verify ID exists in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [otherincome_single](#otherincome_single) - Get current values before update
- [otherincome_delete](#otherincome_delete) - Delete instead of update

---

## otherincome_delete

Delete an other income record.

### Description

Delete an other income record from FreshBooks.

**When to use:**
- User wants to remove incorrect income record
- Deleting duplicate entries
- Removing test or accidental entries

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| incomeId | number | Yes | Income ID to delete |

### Input Example

```json
{
  "accountId": "ABC123",
  "incomeId": 333
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether deletion was successful |
| message | string | Confirmation message |
| incomeId | number | ID of deleted income |

### Output Example

```json
{
  "success": true,
  "message": "Other income deleted successfully",
  "incomeId": 333
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid incomeId | No | Check ID is a positive integer |
| -32005 | Income not found | No | May already be deleted |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [otherincome_single](#otherincome_single) - Verify before deletion
- [otherincome_list](#otherincome_list) - View remaining income

---

## Notes

### Common Income Categories

- **Interest Income** - Interest from savings, investments
- **Dividend Income** - Dividends from investments
- **Grant Income** - Government or private grants
- **Refunds** - Tax refunds, vendor refunds
- **Miscellaneous Income** - One-time or unusual income
- **Investment Income** - Capital gains, investment returns
- **Rental Income** - Property rental income (if not primary business)

### Payment Type Values

Supported payment types include:
- Cash, Check, Credit, Credit Card
- Bank Transfer, ACH, Wire Transfer
- PayPal, Stripe, 2Checkout
- Debit, Interac
- Visa, MasterCard, Discover, AMEX, Nova
- Other

### vs Invoice Income

- **Invoice Income**: Revenue from client billings (tracked via invoices)
- **Other Income**: Non-invoice revenue sources

Both appear in financial reports but are tracked separately for clarity.

### Tax Reporting

Other income is included in:
- Profit & Loss statements
- Tax reports
- Revenue totals

Properly categorize income for accurate tax reporting.
