# Report API Reference

Financial reports provide insights into business performance, including payments collected, profit/loss, and tax summaries.

## report_payments_collected

Generate a report of payments collected within a date range.

### Description

Retrieve a detailed report of all payments received from clients during a specified period.

**When to use:**
- User wants to see all payments received
- User needs revenue report for a period
- User is preparing cash flow statements
- Reconciling bank deposits

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| startDate | string | Yes | Report start date (YYYY-MM-DD) |
| endDate | string | Yes | Report end date (YYYY-MM-DD) |

### Input Example

```json
{
  "accountId": "ABC123",
  "startDate": "2024-12-01",
  "endDate": "2024-12-31"
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| startDate | string | Report start date |
| endDate | string | Report end date |
| payments | PaymentItem[] | List of payments collected |
| totalAmount | Money | Total payments collected in period |

#### PaymentItem Object

| Field | Type | Description |
|-------|------|-------------|
| date | string | Payment date |
| clientName | string | Client who made payment |
| invoiceNumber | string | Associated invoice number |
| amount | Money | Payment amount |
| paymentType | string | Payment method (cash, check, credit card, etc.) |
| notes | string | Payment notes |

### Output Example

```json
{
  "startDate": "2024-12-01",
  "endDate": "2024-12-31",
  "payments": [
    {
      "date": "2024-12-05",
      "clientName": "Acme Corp",
      "invoiceNumber": "INV-2024-001",
      "amount": {
        "amount": "1500.00",
        "code": "USD"
      },
      "paymentType": "Credit Card",
      "notes": "Payment via Stripe"
    },
    {
      "date": "2024-12-15",
      "clientName": "Smith Consulting",
      "invoiceNumber": "INV-2024-002",
      "amount": {
        "amount": "2500.00",
        "code": "USD"
      },
      "paymentType": "Check",
      "notes": "Check #1234"
    }
  ],
  "totalAmount": {
    "amount": "4000.00",
    "code": "USD"
  }
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid date format | No | Use YYYY-MM-DD format |
| -32602 | End date before start date | No | Ensure end date is after start date |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [payment_list](./payments.md#payment_list) - List individual payments
- [report_profit_loss](#report_profit_loss) - Profit & loss report

---

## report_profit_loss

Generate a profit and loss (P&L) report.

### Description

Retrieve a comprehensive profit and loss statement showing revenue, expenses, and net income for a specified period.

**When to use:**
- User needs financial performance summary
- User is preparing tax returns
- User wants to analyze profitability
- Monthly/quarterly/annual financial review

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| startDate | string | Yes | Report start date (YYYY-MM-DD) |
| endDate | string | Yes | Report end date (YYYY-MM-DD) |

### Input Example

```json
{
  "accountId": "ABC123",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| startDate | string | Report start date |
| endDate | string | Report end date |
| revenue | Money | Total revenue for period |
| expenses | Money | Total expenses for period |
| netIncome | Money | Net income (revenue - expenses) |
| lines | ProfitLossLine[] | Detailed breakdown by category |

#### ProfitLossLine Object

| Field | Type | Description |
|-------|------|-------------|
| category | string | Category name (Revenue, Expenses, COGS, etc.) |
| amount | Money | Amount for this category |
| children | array | Sub-categories or line items |

### Output Example

```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "revenue": {
    "amount": "150000.00",
    "code": "USD"
  },
  "expenses": {
    "amount": "85000.00",
    "code": "USD"
  },
  "netIncome": {
    "amount": "65000.00",
    "code": "USD"
  },
  "lines": [
    {
      "category": "Revenue",
      "amount": {
        "amount": "150000.00",
        "code": "USD"
      },
      "children": [
        {
          "category": "Consulting Services",
          "amount": {
            "amount": "120000.00",
            "code": "USD"
          }
        },
        {
          "category": "Other Income",
          "amount": {
            "amount": "30000.00",
            "code": "USD"
          }
        }
      ]
    },
    {
      "category": "Expenses",
      "amount": {
        "amount": "85000.00",
        "code": "USD"
      },
      "children": [
        {
          "category": "Office Expenses",
          "amount": {
            "amount": "25000.00",
            "code": "USD"
          }
        },
        {
          "category": "Travel",
          "amount": {
            "amount": "15000.00",
            "code": "USD"
          }
        },
        {
          "category": "Equipment",
          "amount": {
            "amount": "45000.00",
            "code": "USD"
          }
        }
      ]
    }
  ]
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid date format | No | Use YYYY-MM-DD format |
| -32602 | End date before start date | No | Ensure end date is after start date |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [report_payments_collected](#report_payments_collected) - Revenue details
- [report_tax_summary](#report_tax_summary) - Tax details
- [expense_list](./expenses.md#expense_list) - Expense breakdown

---

## report_tax_summary

Generate a tax summary report.

### Description

Retrieve a summary of taxes collected and paid during a specified period. Useful for tax filing and compliance.

**When to use:**
- User needs tax information for filing
- User wants to review tax collected from clients
- User is preparing sales tax returns
- Quarterly or annual tax reporting

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountId | string | Yes | FreshBooks account identifier |
| startDate | string | Yes | Report start date (YYYY-MM-DD) |
| endDate | string | Yes | Report end date (YYYY-MM-DD) |

### Input Example

```json
{
  "accountId": "ABC123",
  "startDate": "2024-10-01",
  "endDate": "2024-12-31"
}
```

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| startDate | string | Report start date |
| endDate | string | Report end date |
| taxes | TaxSummaryItem[] | Summary by tax type |
| totalTaxCollected | Money | Total tax collected from clients |
| totalTaxPaid | Money | Total tax paid to vendors |

#### TaxSummaryItem Object

| Field | Type | Description |
|-------|------|-------------|
| taxName | string | Tax name (e.g., "Sales Tax", "VAT") |
| taxRate | string | Tax rate percentage |
| taxableAmount | Money | Amount subject to tax |
| taxCollected | Money | Tax amount collected |
| taxPaid | Money | Tax amount paid (if applicable) |

### Output Example

```json
{
  "startDate": "2024-10-01",
  "endDate": "2024-12-31",
  "taxes": [
    {
      "taxName": "Sales Tax",
      "taxRate": "8.5",
      "taxableAmount": {
        "amount": "50000.00",
        "code": "USD"
      },
      "taxCollected": {
        "amount": "4250.00",
        "code": "USD"
      }
    },
    {
      "taxName": "State Tax",
      "taxRate": "2.0",
      "taxableAmount": {
        "amount": "50000.00",
        "code": "USD"
      },
      "taxCollected": {
        "amount": "1000.00",
        "code": "USD"
      }
    }
  ],
  "totalTaxCollected": {
    "amount": "5250.00",
    "code": "USD"
  },
  "totalTaxPaid": {
    "amount": "0.00",
    "code": "USD"
  }
}
```

### Errors

| Code | Condition | Recoverable | Recovery |
|------|-----------|-------------|----------|
| -32602 | Invalid date format | No | Use YYYY-MM-DD format |
| -32602 | End date before start date | No | Ensure end date is after start date |
| -32001 | Not authenticated | Yes | Call auth_get_url to authenticate |

### Related Tools

- [report_profit_loss](#report_profit_loss) - Overall financial picture
- [invoice_list](./invoices.md#invoice_list) - View taxed invoices

---

## Notes

### Date Format

All report dates use YYYY-MM-DD format (not ISO 8601):
- `2024-01-01` (January 1, 2024)
- `2024-12-31` (December 31, 2024)

### Report Periods

Common reporting periods:
- **Monthly**: First to last day of month
- **Quarterly**: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
- **Annual**: January 1 to December 31
- **Fiscal Year**: Based on business fiscal year start

### Cash vs Accrual

FreshBooks reports can show:
- **Cash basis**: Income when received, expenses when paid
- **Accrual basis**: Income when invoiced, expenses when incurred

Check FreshBooks account settings for reporting basis.

### Tax Compliance

Tax summary reports help with:
- Sales tax/VAT returns
- Income tax preparation
- Quarterly tax payments
- Annual tax filing

Always consult with a tax professional for compliance requirements.

### Export and Analysis

Reports can be used for:
- Financial analysis
- Investor presentations
- Loan applications
- Business planning
- Tax preparation
