# Journal Entry Account API Reference

Journal entry accounts represent the chart of accounts - the list of all accounts used in accounting (assets, liabilities, equity, revenue, expenses).

## journalentryaccount_list

List accounts from the chart of accounts.

### Description

Retrieve the list of accounts available for use in journal entries. These represent all accounts in your FreshBooks chart of accounts.

**When to use:**
- User needs to find account IDs for journal entries
- User wants to see their chart of accounts
- Finding correct accounts for accounting transactions
- Building account selection UI

### Input Schema

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| accountId | string | Yes | - | FreshBooks account identifier |
| page | number | No | 1 | Page number (1-indexed) |
| perPage | number | No | 30 | Results per page (max 100) |

### Input Example

```json
{
  "accountId": "ABC123",
  "page": 1,
  "perPage": 100
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| accounts | JournalEntryAccount[] | Array of account objects |
| pagination | Pagination | Pagination metadata |

#### JournalEntryAccount Object

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | number | No | Unique account identifier (sub-account ID) |
| accountNumber | string | Yes | Account number |
| accountName | string | No | Account name |
| accountType | string | No | Account type (asset, liability, equity, revenue, expense) |
| subAccountType | string | Yes | More specific account classification |
| balance | object | Yes | Current account balance |
| description | string | Yes | Account description |
| parentAccountId | number | Yes | Parent account ID if sub-account |

### Output Example

```json
{
  "accounts": [
    {
      "id": 100,
      "accountNumber": "1000",
      "accountName": "Cash",
      "accountType": "asset",
      "subAccountType": "current_asset",
      "balance": {
        "amount": "25000.00",
        "code": "USD"
      },
      "description": "Operating cash account",
      "parentAccountId": null
    },
    {
      "id": 200,
      "accountNumber": "2000",
      "accountName": "Accounts Payable",
      "accountType": "liability",
      "subAccountType": "current_liability",
      "balance": {
        "amount": "8500.00",
        "code": "USD"
      },
      "description": "Amounts owed to vendors",
      "parentAccountId": null
    },
    {
      "id": 400,
      "accountNumber": "4000",
      "accountName": "Service Revenue",
      "accountType": "revenue",
      "subAccountType": "operating_revenue",
      "balance": {
        "amount": "150000.00",
        "code": "USD"
      },
      "description": "Revenue from services",
      "parentAccountId": null
    },
    {
      "id": 500,
      "accountNumber": "5000",
      "accountName": "Office Expenses",
      "accountType": "expense",
      "subAccountType": "operating_expense",
      "balance": {
        "amount": "25000.00",
        "code": "USD"
      },
      "description": "General office operating expenses",
      "parentAccountId": null
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 1,
    "total": 45,
    "perPage": 100
  }
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid accountId format | No | Check account ID is valid |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [journalentry_create](./journal-entries.md#journalentry_create) - Use account IDs in journal entries

---

## Notes

### Account Types

The chart of accounts is organized into five main types:

**1. Assets** (Debit increases)
- Current Assets: Cash, Accounts Receivable, Inventory
- Fixed Assets: Equipment, Buildings, Land
- Other Assets: Investments, Intangibles

**2. Liabilities** (Credit increases)
- Current Liabilities: Accounts Payable, Short-term Loans
- Long-term Liabilities: Mortgages, Bonds Payable

**3. Equity** (Credit increases)
- Owner's Equity
- Retained Earnings
- Common Stock

**4. Revenue** (Credit increases)
- Operating Revenue: Sales, Service Income
- Other Revenue: Interest Income, Gains

**5. Expenses** (Debit increases)
- Operating Expenses: Salaries, Rent, Utilities
- Cost of Goods Sold
- Other Expenses: Interest Expense, Losses

### Account Numbers

- Accounts may have account numbers for organization
- Common numbering: 1000s (Assets), 2000s (Liabilities), 3000s (Equity), 4000s (Revenue), 5000s (Expenses)
- Numbers are for reference and reporting

### Using Account IDs

When creating journal entries, use the `id` field (sub-account ID) in the `subAccountId` parameter.

### Chart of Accounts Structure

Accounts can be organized hierarchically:
- **Parent accounts** - High-level categories (`parentAccountId: null`)
- **Sub-accounts** - Detailed breakdowns (`parentAccountId` points to parent)

### Balance Information

Account balances show current totals:
- **Debit balance** - Assets and Expenses typically have debit balances
- **Credit balance** - Liabilities, Equity, and Revenue have credit balances
- Balances update automatically with transactions

### Read-Only

The chart of accounts is typically read-only via the API. Accounts are created and managed through the FreshBooks web interface.

### Business-Specific

Each FreshBooks business has its own chart of accounts. Account IDs are unique to each business.

### Finding the Right Account

When creating journal entries:
1. List all accounts
2. Find the appropriate account type (asset/liability/equity/revenue/expense)
3. Select the specific sub-account
4. Use the account ID in your journal entry

### Standard vs Custom Accounts

- **Standard accounts** - Pre-configured by FreshBooks
- **Custom accounts** - Created by the business for specific needs

Both appear in the list and can be used in journal entries.
