# Journal Entry API Reference

Journal entries allow for manual accounting adjustments by debiting and crediting accounts directly. Used for corrections, adjustments, and entries not covered by standard transactions.

## journalentry_create

Create a new journal entry.

### Description

Create a manual accounting journal entry with debit and credit lines that must balance.

**When to use:**
- User needs to make accounting adjustments
- Recording transactions not handled by invoices/expenses
- Correcting accounting errors
- Period-end adjustments
- Depreciation entries
- Accruals and deferrals

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| accountId | string | Yes | - | FreshBooks account identifier |
| name | string | Yes | - | Journal entry name/description |
| date | string | Yes | - | Entry date (YYYY-MM-DD) |
| description | string | No | - | Detailed description of the adjustment |
| currencyCode | string | No | USD | Currency code |
| details | JournalEntryDetail[] | Yes | - | Debit and credit lines (minimum 2, must balance) |

#### JournalEntryDetail Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| subAccountId | number | Yes | Sub-account ID from chart of accounts |
| debit | string | No* | Debit amount (decimal string) |
| credit | string | No* | Credit amount (decimal string) |
| description | string | No | Line description |

*Each detail must have either debit OR credit (not both).

### Input Example

```json
{
  "accountId": "ABC123",
  "name": "Depreciation - Office Equipment",
  "date": "2024-12-31",
  "description": "Annual depreciation expense for office equipment",
  "currencyCode": "USD",
  "details": [
    {
      "subAccountId": 501,
      "debit": "5000.00",
      "description": "Depreciation Expense"
    },
    {
      "subAccountId": 150,
      "credit": "5000.00",
      "description": "Accumulated Depreciation - Equipment"
    }
  ]
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| id | number | Unique journal entry identifier |
| name | string | Journal entry name/description |
| description | string | Detailed description |
| date | string | Entry date (YYYY-MM-DD) |
| details | JournalEntryDetail[] | Debit and credit lines |
| currencyCode | string | Currency code |
| createdAt | string | Creation timestamp (ISO 8601) |

### Output Example

```json
{
  "id": 12345,
  "name": "Depreciation - Office Equipment",
  "description": "Annual depreciation expense for office equipment",
  "date": "2024-12-31",
  "details": [
    {
      "subAccountId": 501,
      "debit": "5000.00",
      "description": "Depreciation Expense"
    },
    {
      "subAccountId": 150,
      "credit": "5000.00",
      "description": "Accumulated Depreciation - Equipment"
    }
  ],
  "currencyCode": "USD",
  "createdAt": "2024-12-31T10:00:00Z"
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Missing required fields | No | Provide name, date, details |
| -32602 | Details don't balance | No | Ensure total debits = total credits |
| -32602 | Less than 2 detail lines | No | Provide at least 2 lines |
| -32602 | Invalid date format | No | Use YYYY-MM-DD format |
| -32013 | Invalid subAccountId | Yes | Verify account exists |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [journalentryaccount_list](./journal-entry-accounts.md#journalentryaccount_list) - Find account IDs

---

## Notes

### Double-Entry Accounting

Journal entries follow double-entry accounting principles:
- Every entry has equal debits and credits
- Total debits must equal total credits
- Minimum 2 lines per entry (one debit, one credit)

### Account Types

Different account types require debits or credits to increase:

**Debit to Increase:**
- Assets (Cash, Accounts Receivable, Equipment)
- Expenses (Salaries, Rent, Utilities)

**Credit to Increase:**
- Liabilities (Accounts Payable, Loans)
- Equity (Owner's Capital, Retained Earnings)
- Revenue (Sales, Service Income)

### Common Journal Entries

**Depreciation:**
```
Debit: Depreciation Expense
Credit: Accumulated Depreciation
```

**Accrued Expense:**
```
Debit: Expense Account
Credit: Accounts Payable
```

**Prepaid Expense:**
```
Debit: Expense Account
Credit: Prepaid Expense Asset
```

**Owner's Draw:**
```
Debit: Owner's Draw
Credit: Cash
```

### Sub-Account IDs

Use `journalentryaccount_list` to find valid sub-account IDs from your chart of accounts. Each business has different account IDs.

### Date Format

Journal entry dates use YYYY-MM-DD format (not ISO 8601):
- `2024-12-31` (December 31, 2024)
- `2024-01-01` (January 1, 2024)

### Validation

FreshBooks validates:
- Debits equal credits
- Valid sub-account IDs
- Positive amounts
- Valid date format

### Best Practices

1. **Clear descriptions** - Explain the purpose of each entry
2. **Backup documentation** - Keep supporting documents
3. **Period-end timing** - Date entries appropriately
4. **Review balances** - Verify amounts before creating
5. **Consult accountant** - For complex transactions

### Limitations

- Cannot update journal entries (create-only)
- Cannot delete journal entries in most cases
- Permanent impact on financial statements
- Should be created by users with accounting knowledge
