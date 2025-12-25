# Expense Category API Reference

Expense categories are predefined classifications for business expenses (e.g., Travel, Meals, Office Supplies). They are primarily read-only in FreshBooks.

## expensecategory_list

List expense categories from FreshBooks.

### Description

Retrieve a list of available expense categories. Categories are typically predefined by FreshBooks and used to classify expenses for reporting and tax purposes.

**When to use:**
- User needs to see available expense categories
- Finding category IDs for expense creation
- Reviewing expense classification options
- Building expense category picker UI

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
  "perPage": 50
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| categories | ExpenseCategory[] | Array of expense category objects |
| pagination | Pagination | Pagination metadata |

#### ExpenseCategory Object

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | number | No | Unique category identifier |
| categoryid | number | Yes | Category ID (alternate field) |
| category | string | No | Category name (e.g., "Travel", "Meals") |
| visState | number | Yes | Visibility state (0=active, 1=deleted, 2=archived) |
| updated | string | Yes | Last update timestamp (ISO 8601) |
| is_cogs | boolean | Yes | Whether category is Cost of Goods Sold |
| is_editable | boolean | Yes | Whether category can be edited |
| parentid | number | Yes | Parent category ID if subcategory |

### Output Example

```json
{
  "categories": [
    {
      "id": 1,
      "category": "Travel",
      "visState": 0,
      "is_cogs": false,
      "is_editable": false,
      "parentid": null
    },
    {
      "id": 2,
      "category": "Meals and Entertainment",
      "visState": 0,
      "is_cogs": false,
      "is_editable": false,
      "parentid": null
    },
    {
      "id": 3,
      "category": "Office Supplies",
      "visState": 0,
      "is_cogs": false,
      "is_editable": false,
      "parentid": null
    },
    {
      "id": 4,
      "category": "Professional Fees",
      "visState": 0,
      "is_cogs": false,
      "is_editable": false,
      "parentid": null
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 1,
    "total": 24,
    "perPage": 50
  }
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid accountId format | No | Check account ID is valid |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |
| -32004 | Rate limit exceeded | Yes | Wait and retry after delay |

### Related Tools

- [expensecategory_single](#expensecategory_single) - Get single category by ID
- [expense_create](./expenses.md#expense_create) - Create expense with category
- [expense_list](./expenses.md#expense_list) - Filter expenses by category

---

## expensecategory_single

Get a single expense category by ID.

### Description

Retrieve detailed information about a specific expense category.

**When to use:**
- User asks for details about a specific category
- Verifying category information before creating expense
- Looking up category details by ID

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| categoryId | number | Yes | Category ID to retrieve |

### Input Example

```json
{
  "accountId": "ABC123",
  "categoryId": 5
}
```

### Output Schema

Returns a single ExpenseCategory object (see [expensecategory_list](#expensecategory-object) for schema).

### Output Example

```json
{
  "id": 5,
  "category": "Automobile",
  "visState": 0,
  "is_cogs": false,
  "is_editable": false,
  "parentid": null
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid categoryId | No | Check ID is a positive integer |
| -32005 | Category not found | No | Verify ID exists in FreshBooks |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [expensecategory_list](#expensecategory_list) - Find category IDs
- [expense_create](./expenses.md#expense_create) - Use category for expense

---

## Notes

### Common Expense Categories

FreshBooks typically provides these standard categories:

- **Travel** - Transportation, hotels, lodging
- **Meals and Entertainment** - Client meals, business entertainment
- **Office Supplies** - Stationery, supplies, equipment
- **Professional Fees** - Legal, accounting, consulting fees
- **Automobile** - Vehicle expenses, fuel, maintenance
- **Advertising** - Marketing and promotional costs
- **Insurance** - Business insurance premiums
- **Interest** - Business loan interest
- **Rent** - Office or equipment rental
- **Utilities** - Phone, internet, electricity
- **Taxes** - Business taxes and licenses
- **Depreciation** - Asset depreciation
- **Bank Charges** - Banking fees and charges

### Cost of Goods Sold (COGS)

Categories with `is_cogs: true` are used for direct costs of producing goods or services sold. These appear separately in profit/loss reports.

### Editable Categories

Most categories are system-defined (`is_editable: false`). Some FreshBooks accounts may support custom categories with `is_editable: true`.

### Read-Only Resource

Expense categories are primarily read-only. This MCP server currently only supports listing and retrieving categories, not creating or modifying them.

### Tax Reporting

Expense categories are used for:
- Tax deduction classification
- Financial reporting
- Profit & loss statements
- Business expense analysis

Choose the appropriate category for accurate tax reporting and financial insights.
