# Financial Reporting Workflow

Complete examples for generating and analyzing financial reports in FreshBooks using the MCP server.

## Overview

This guide demonstrates financial reporting workflows including:

1. Running profit and loss reports
2. Generating payments collected reports
3. Creating tax summary reports
4. Analyzing business performance

---

## Workflow 1: Monthly Profit & Loss Report

Generate a comprehensive profit and loss statement for a month.

### Step 1: Run Monthly P&L Report

**Tool Call:**
```json
{
  "tool": "report_profit_loss",
  "input": {
    "accountId": "ABC123",
    "startDate": "2024-12-01",
    "endDate": "2024-12-31"
  }
}
```

**Response:**
```json
{
  "startDate": "2024-12-01",
  "endDate": "2024-12-31",
  "revenue": {
    "amount": "45000.00",
    "code": "USD"
  },
  "expenses": {
    "amount": "18500.00",
    "code": "USD"
  },
  "netIncome": {
    "amount": "26500.00",
    "code": "USD"
  },
  "lines": [
    {
      "category": "Revenue",
      "amount": {
        "amount": "45000.00",
        "code": "USD"
      },
      "children": [
        {
          "category": "Consulting Services",
          "amount": {
            "amount": "35000.00",
            "code": "USD"
          }
        },
        {
          "category": "Development Services",
          "amount": {
            "amount": "10000.00",
            "code": "USD"
          }
        }
      ]
    },
    {
      "category": "Expenses",
      "amount": {
        "amount": "18500.00",
        "code": "USD"
      },
      "children": [
        {
          "category": "Office Expenses",
          "amount": {
            "amount": "2500.00",
            "code": "USD"
          }
        },
        {
          "category": "Software",
          "amount": {
            "amount": "1200.00",
            "code": "USD"
          }
        },
        {
          "category": "Travel",
          "amount": {
            "amount": "3800.00",
            "code": "USD"
          }
        },
        {
          "category": "Equipment",
          "amount": {
            "amount": "8000.00",
            "code": "USD"
          }
        },
        {
          "category": "Professional Services",
          "amount": {
            "amount": "3000.00",
            "code": "USD"
          }
        }
      ]
    }
  ]
}
```

**Analysis:**
- **Total Revenue:** $45,000
- **Total Expenses:** $18,500
- **Net Profit:** $26,500 (58.9% profit margin)
- **Top Revenue Source:** Consulting Services ($35,000)
- **Largest Expense:** Equipment ($8,000)

---

## Workflow 2: Quarterly Performance Analysis

Compare quarters to track business growth.

### Step 1: Run Q4 2024 Report

**Tool Call:**
```json
{
  "tool": "report_profit_loss",
  "input": {
    "accountId": "ABC123",
    "startDate": "2024-10-01",
    "endDate": "2024-12-31"
  }
}
```

**Response:**
```json
{
  "startDate": "2024-10-01",
  "endDate": "2024-12-31",
  "revenue": {
    "amount": "135000.00",
    "code": "USD"
  },
  "expenses": {
    "amount": "52000.00",
    "code": "USD"
  },
  "netIncome": {
    "amount": "83000.00",
    "code": "USD"
  }
}
```

### Step 2: Run Q3 2024 Report for Comparison

**Tool Call:**
```json
{
  "tool": "report_profit_loss",
  "input": {
    "accountId": "ABC123",
    "startDate": "2024-07-01",
    "endDate": "2024-09-30"
  }
}
```

**Response:**
```json
{
  "startDate": "2024-07-01",
  "endDate": "2024-09-30",
  "revenue": {
    "amount": "120000.00",
    "code": "USD"
  },
  "expenses": {
    "amount": "48000.00",
    "code": "USD"
  },
  "netIncome": {
    "amount": "72000.00",
    "code": "USD"
  }
}
```

**Quarter-over-Quarter Analysis:**

| Metric | Q3 2024 | Q4 2024 | Change | % Change |
|--------|---------|---------|--------|----------|
| Revenue | $120,000 | $135,000 | +$15,000 | +12.5% |
| Expenses | $48,000 | $52,000 | +$4,000 | +8.3% |
| Net Income | $72,000 | $83,000 | +$11,000 | +15.3% |
| Profit Margin | 60.0% | 61.5% | +1.5% | - |

**Insights:**
- Revenue growing faster than expenses
- Profit margin improving
- Strong business growth trajectory

---

## Workflow 3: Annual Financial Summary

Generate a complete year-end financial report.

### Step 1: Run Annual P&L Report

**Tool Call:**
```json
{
  "tool": "report_profit_loss",
  "input": {
    "accountId": "ABC123",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }
}
```

**Response:**
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "revenue": {
    "amount": "485000.00",
    "code": "USD"
  },
  "expenses": {
    "amount": "195000.00",
    "code": "USD"
  },
  "netIncome": {
    "amount": "290000.00",
    "code": "USD"
  },
  "lines": [
    {
      "category": "Revenue",
      "amount": {
        "amount": "485000.00",
        "code": "USD"
      },
      "children": [
        {
          "category": "Consulting Services",
          "amount": {
            "amount": "350000.00",
            "code": "USD"
          }
        },
        {
          "category": "Development Services",
          "amount": {
            "amount": "120000.00",
            "code": "USD"
          }
        },
        {
          "category": "Other Income",
          "amount": {
            "amount": "15000.00",
            "code": "USD"
          }
        }
      ]
    },
    {
      "category": "Expenses",
      "amount": {
        "amount": "195000.00",
        "code": "USD"
      },
      "children": [
        {
          "category": "Office Expenses",
          "amount": {
            "amount": "28000.00",
            "code": "USD"
          }
        },
        {
          "category": "Software",
          "amount": {
            "amount": "15000.00",
            "code": "USD"
          }
        },
        {
          "category": "Travel",
          "amount": {
            "amount": "35000.00",
            "code": "USD"
          }
        },
        {
          "category": "Equipment",
          "amount": {
            "amount": "45000.00",
            "code": "USD"
          }
        },
        {
          "category": "Professional Services",
          "amount": {
            "amount": "25000.00",
            "code": "USD"
          }
        },
        {
          "category": "Marketing",
          "amount": {
            "amount": "22000.00",
            "code": "USD"
          }
        },
        {
          "category": "Insurance",
          "amount": {
            "amount": "12000.00",
            "code": "USD"
          }
        },
        {
          "category": "Utilities",
          "amount": {
            "amount": "8000.00",
            "code": "USD"
          }
        },
        {
          "category": "Miscellaneous",
          "amount": {
            "amount": "5000.00",
            "code": "USD"
          }
        }
      ]
    }
  ]
}
```

**Annual Summary:**
- **Gross Revenue:** $485,000
- **Total Expenses:** $195,000
- **Net Profit:** $290,000
- **Profit Margin:** 59.8%

**Revenue Breakdown:**
- Consulting: $350,000 (72.2%)
- Development: $120,000 (24.7%)
- Other: $15,000 (3.1%)

**Expense Breakdown:**
- Equipment: $45,000 (23.1%)
- Travel: $35,000 (17.9%)
- Office: $28,000 (14.4%)
- Professional Services: $25,000 (12.8%)
- Marketing: $22,000 (11.3%)
- Other: $40,000 (20.5%)

---

## Workflow 4: Payments Collected Report

Track cash flow and payments received.

### Step 1: Run Monthly Payments Report

**Tool Call:**
```json
{
  "tool": "report_payments_collected",
  "input": {
    "accountId": "ABC123",
    "startDate": "2024-12-01",
    "endDate": "2024-12-31"
  }
}
```

**Response:**
```json
{
  "startDate": "2024-12-01",
  "endDate": "2024-12-31",
  "payments": [
    {
      "date": "2024-12-05",
      "clientName": "Acme Corp",
      "invoiceNumber": "INV-2024-045",
      "amount": {
        "amount": "5500.00",
        "code": "USD"
      },
      "paymentType": "Credit Card",
      "notes": "Payment via Stripe"
    },
    {
      "date": "2024-12-10",
      "clientName": "Smith Consulting",
      "invoiceNumber": "INV-2024-046",
      "amount": {
        "amount": "8200.00",
        "code": "USD"
      },
      "paymentType": "Bank Transfer",
      "notes": "Wire transfer"
    },
    {
      "date": "2024-12-15",
      "clientName": "TechStart Inc",
      "invoiceNumber": "INV-2024-047",
      "amount": {
        "amount": "3500.00",
        "code": "USD"
      },
      "paymentType": "Check",
      "notes": "Check #5678"
    },
    {
      "date": "2024-12-20",
      "clientName": "Global Industries",
      "invoiceNumber": "INV-2024-048",
      "amount": {
        "amount": "12000.00",
        "code": "USD"
      },
      "paymentType": "Credit Card",
      "notes": "Recurring monthly retainer"
    },
    {
      "date": "2024-12-28",
      "clientName": "Local Business LLC",
      "invoiceNumber": "INV-2024-049",
      "amount": {
        "amount": "2800.00",
        "code": "USD"
      },
      "paymentType": "PayPal",
      "notes": "PayPal payment"
    }
  ],
  "totalAmount": {
    "amount": "32000.00",
    "code": "USD"
  }
}
```

**Analysis:**
- **Total Collections:** $32,000
- **Number of Payments:** 5
- **Average Payment:** $6,400
- **Largest Payment:** $12,000 (Global Industries)
- **Payment Methods:**
  - Credit Card: $17,500 (54.7%)
  - Bank Transfer: $8,200 (25.6%)
  - Check: $3,500 (10.9%)
  - PayPal: $2,800 (8.8%)

### Step 2: Compare to Previous Month

**Tool Call:**
```json
{
  "tool": "report_payments_collected",
  "input": {
    "accountId": "ABC123",
    "startDate": "2024-11-01",
    "endDate": "2024-11-30"
  }
}
```

**Response:**
```json
{
  "startDate": "2024-11-01",
  "endDate": "2024-11-30",
  "payments": [ /* ... */ ],
  "totalAmount": {
    "amount": "28500.00",
    "code": "USD"
  }
}
```

**Month-over-Month Comparison:**
- November: $28,500
- December: $32,000
- **Change:** +$3,500 (+12.3%)

---

## Workflow 5: Tax Summary for Filing

Generate tax reports for compliance and filing.

### Step 1: Run Quarterly Tax Summary

**Tool Call:**
```json
{
  "tool": "report_tax_summary",
  "input": {
    "accountId": "ABC123",
    "startDate": "2024-10-01",
    "endDate": "2024-12-31"
  }
}
```

**Response:**
```json
{
  "startDate": "2024-10-01",
  "endDate": "2024-12-31",
  "taxes": [
    {
      "taxName": "Sales Tax",
      "taxRate": "8.5",
      "taxableAmount": {
        "amount": "125000.00",
        "code": "USD"
      },
      "taxCollected": {
        "amount": "10625.00",
        "code": "USD"
      }
    },
    {
      "taxName": "State Tax",
      "taxRate": "2.0",
      "taxableAmount": {
        "amount": "125000.00",
        "code": "USD"
      },
      "taxCollected": {
        "amount": "2500.00",
        "code": "USD"
      }
    }
  ],
  "totalTaxCollected": {
    "amount": "13125.00",
    "code": "USD"
  },
  "totalTaxPaid": {
    "amount": "0.00",
    "code": "USD"
  }
}
```

**Tax Summary:**
- **Taxable Sales:** $125,000
- **Sales Tax Collected (8.5%):** $10,625
- **State Tax Collected (2.0%):** $2,500
- **Total Tax to Remit:** $13,125

### Step 2: Run Annual Tax Summary

**Tool Call:**
```json
{
  "tool": "report_tax_summary",
  "input": {
    "accountId": "ABC123",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }
}
```

**Response:**
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "taxes": [
    {
      "taxName": "Sales Tax",
      "taxRate": "8.5",
      "taxableAmount": {
        "amount": "450000.00",
        "code": "USD"
      },
      "taxCollected": {
        "amount": "38250.00",
        "code": "USD"
      }
    },
    {
      "taxName": "State Tax",
      "taxRate": "2.0",
      "taxableAmount": {
        "amount": "450000.00",
        "code": "USD"
      },
      "taxCollected": {
        "amount": "9000.00",
        "code": "USD"
      }
    }
  ],
  "totalTaxCollected": {
    "amount": "47250.00",
    "code": "USD"
  },
  "totalTaxPaid": {
    "amount": "0.00",
    "code": "USD"
  }
}
```

**Annual Tax Summary:**
- **Total Taxable Sales:** $450,000
- **Total Sales Tax:** $38,250
- **Total State Tax:** $9,000
- **Total Tax Collected:** $47,250

---

## Workflow 6: Cash Flow Analysis

Combine payment and expense data for cash flow insights.

### Step 1: Get Payments Collected

**Tool Call:**
```json
{
  "tool": "report_payments_collected",
  "input": {
    "accountId": "ABC123",
    "startDate": "2024-12-01",
    "endDate": "2024-12-31"
  }
}
```

**Response:**
```json
{
  "totalAmount": {
    "amount": "32000.00",
    "code": "USD"
  }
}
```

### Step 2: Get Bill Payments Made

**Tool Call:**
```json
{
  "tool": "billpayment_list",
  "input": {
    "accountId": "ABC123",
    "startDate": "2024-12-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z"
  }
}
```

**Response:**
```json
{
  "billPayments": [
    {
      "amount": {
        "amount": "2500.00",
        "code": "USD"
      },
      "paymentDate": "2024-12-10T00:00:00Z"
    },
    {
      "amount": {
        "amount": "1200.00",
        "code": "USD"
      },
      "paymentDate": "2024-12-15T00:00:00Z"
    },
    {
      "amount": {
        "amount": "800.00",
        "code": "USD"
      },
      "paymentDate": "2024-12-20T00:00:00Z"
    }
  ]
}
```

**Total Bill Payments:** $4,500

### Step 3: Get Expenses Paid

**Tool Call:**
```json
{
  "tool": "expense_list",
  "input": {
    "accountId": "ABC123",
    "dateFrom": "2024-12-01T00:00:00Z",
    "dateTo": "2024-12-31T23:59:59Z",
    "status": "paid"
  }
}
```

**Response:**
```json
{
  "expenses": [
    {
      "amount": {
        "amount": "125.50",
        "code": "USD"
      }
    },
    {
      "amount": {
        "amount": "450.00",
        "code": "USD"
      }
    },
    {
      "amount": {
        "amount": "200.00",
        "code": "USD"
      }
    }
  ]
}
```

**Total Expenses Paid:** $775.50

### Step 4: Calculate Net Cash Flow

**Cash Flow Analysis for December 2024:**

| Category | Amount |
|----------|--------|
| **Cash Inflows** | |
| Payments Received | $32,000.00 |
| **Total Inflows** | **$32,000.00** |
| | |
| **Cash Outflows** | |
| Bill Payments | $4,500.00 |
| Direct Expenses | $775.50 |
| **Total Outflows** | **$5,275.50** |
| | |
| **Net Cash Flow** | **$26,724.50** |

**Insights:**
- Strong positive cash flow
- Cash inflows 6x larger than outflows
- Healthy operating cash position

---

## Workflow 7: Client Revenue Analysis

Identify top clients by revenue.

### Step 1: List All Invoices by Client

**Tool Call for Client #1:**
```json
{
  "tool": "invoice_list",
  "input": {
    "accountId": "ABC123",
    "clientId": 12345,
    "dateFrom": "2024-01-01",
    "dateTo": "2024-12-31"
  }
}
```

**Response:**
```json
{
  "invoices": [
    {
      "amount": {
        "amount": "5500.00",
        "code": "USD"
      },
      "status": "paid"
    },
    {
      "amount": {
        "amount": "8200.00",
        "code": "USD"
      },
      "status": "paid"
    },
    {
      "amount": {
        "amount": "4500.00",
        "code": "USD"
      },
      "status": "paid"
    }
  ]
}
```

**Client Revenue:** $18,200

**Repeat for other clients to build ranking:**

| Rank | Client | Annual Revenue | % of Total |
|------|--------|----------------|------------|
| 1 | Global Industries | $144,000 | 29.7% |
| 2 | TechStart Inc | $98,000 | 20.2% |
| 3 | Acme Corp | $72,000 | 14.8% |
| 4 | Smith Consulting | $55,000 | 11.3% |
| 5 | Local Business LLC | $42,000 | 8.7% |
| - | Others | $74,000 | 15.3% |

**Insights:**
- Top 3 clients represent 64.7% of revenue
- Client concentration risk with Global Industries
- Opportunity to diversify client base

---

## Common Report Periods

### Monthly Reports

Good for:
- Regular performance tracking
- Cash flow monitoring
- Timely adjustments

**Example:**
```json
{
  "startDate": "2024-12-01",
  "endDate": "2024-12-31"
}
```

### Quarterly Reports

Good for:
- Trend analysis
- Tax preparation
- Board/investor reporting

**Q1:** Jan 1 - Mar 31
**Q2:** Apr 1 - Jun 30
**Q3:** Jul 1 - Sep 30
**Q4:** Oct 1 - Dec 31

**Example:**
```json
{
  "startDate": "2024-10-01",
  "endDate": "2024-12-31"
}
```

### Annual Reports

Good for:
- Tax filing
- Year-end review
- Strategic planning

**Example:**
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

### Custom Periods

Good for:
- Project-specific analysis
- Event-based reporting
- Ad-hoc analysis

**Example (90 days):**
```json
{
  "startDate": "2024-10-01",
  "endDate": "2024-12-29"
}
```

---

## Key Performance Indicators (KPIs)

### Profitability Metrics

**Gross Profit Margin:**
```
(Revenue - Direct Costs) / Revenue × 100
```

**Net Profit Margin:**
```
Net Income / Revenue × 100
```

**Operating Expense Ratio:**
```
Operating Expenses / Revenue × 100
```

### Cash Flow Metrics

**Operating Cash Flow:**
```
Cash Received - Cash Paid
```

**Days Sales Outstanding (DSO):**
```
(Accounts Receivable / Total Sales) × Days in Period
```

### Growth Metrics

**Revenue Growth Rate:**
```
((Current Period - Previous Period) / Previous Period) × 100
```

**Client Retention Rate:**
```
(Clients at End - New Clients) / Clients at Start × 100
```

---

## Error Handling Tips

### Error: Invalid Date Range

**Error Response:**
```json
{
  "error": {
    "code": -32602,
    "message": "End date must be after start date"
  }
}
```

**Recovery:**
- Verify date order (start before end)
- Use correct YYYY-MM-DD format
- Check for typos in dates

### Error: Date Format Incorrect

**Error Response:**
```json
{
  "error": {
    "code": -32602,
    "message": "Invalid date format. Use YYYY-MM-DD"
  }
}
```

**Recovery:**
- Use YYYY-MM-DD format (not ISO 8601 with time)
- Example: "2024-12-31" not "2024-12-31T23:59:59Z"

---

## Best Practices

1. **Run reports regularly** - Monthly minimum for active monitoring
2. **Compare periods** - Track trends over time
3. **Review for accuracy** - Verify data before making decisions
4. **Export for analysis** - Use data in spreadsheets for deeper insights
5. **Share with stakeholders** - Keep partners/investors informed
6. **Look for trends** - Identify patterns in revenue and expenses
7. **Plan ahead** - Use reports for forecasting and budgeting
8. **Tax compliance** - Keep quarterly tax reports for filing
9. **Document insights** - Note key findings and action items
10. **Set targets** - Use historical data to set realistic goals

---

## Report Scheduling Recommendations

| Report Type | Frequency | Purpose |
|-------------|-----------|---------|
| Payments Collected | Weekly | Cash flow monitoring |
| Profit & Loss | Monthly | Performance tracking |
| Tax Summary | Quarterly | Tax preparation |
| Annual Summary | Yearly | Tax filing, planning |
| Client Revenue | Quarterly | Relationship management |
| Expense Analysis | Monthly | Cost control |

---

## Using Reports for Decision Making

### Pricing Decisions

Use P&L reports to:
- Understand true cost of services
- Set profitable pricing
- Identify underpriced services

### Cost Reduction

Use expense reports to:
- Identify spending trends
- Find cost-cutting opportunities
- Negotiate better vendor rates

### Cash Flow Management

Use payment reports to:
- Predict cash needs
- Manage payment timing
- Identify collection issues

### Tax Planning

Use tax summaries to:
- Estimate quarterly payments
- Plan for year-end tax bill
- Identify deductible expenses

### Growth Strategy

Use revenue reports to:
- Identify top clients
- Find growth opportunities
- Allocate resources effectively

---

## Common Accounting Scenarios

### Scenario 1: Preparing for Tax Season

**Steps:**
1. Run annual P&L report (Jan 1 - Dec 31)
2. Run annual tax summary report
3. Review expense categories for deductions
4. Generate payments collected report
5. Compile for accountant or tax software

### Scenario 2: Applying for Business Loan

**Steps:**
1. Run last 12 months P&L
2. Generate quarterly comparisons
3. Show revenue growth trends
4. Demonstrate positive cash flow
5. Provide client diversification data

### Scenario 3: Monthly Business Review

**Steps:**
1. Run current month P&L
2. Compare to previous month
3. Review payment collections
4. Check outstanding invoices
5. Analyze expense categories

### Scenario 4: Year-End Planning

**Steps:**
1. Run Q4 reports
2. Project full-year numbers
3. Identify tax optimization opportunities
4. Plan Q1 budget and goals
5. Review client relationships

---

## Financial Health Checklist

Use reports to answer these questions:

- [ ] Is revenue growing month-over-month?
- [ ] Is profit margin improving or stable?
- [ ] Are expenses under control?
- [ ] Is cash flow positive?
- [ ] Are receivables being collected timely?
- [ ] Are payables being paid on time?
- [ ] Is tax liability being tracked?
- [ ] Are top clients identified and managed?
- [ ] Are expense categories properly allocated?
- [ ] Is the business meeting financial goals?

---

**Remember:** Financial reports are only useful when acted upon. Review regularly, identify trends, and make data-driven decisions for business success.
