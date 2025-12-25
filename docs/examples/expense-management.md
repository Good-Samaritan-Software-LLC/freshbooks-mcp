# Expense Management Workflow

Complete examples for tracking expenses and managing vendor bills in FreshBooks using the MCP server.

## Overview

This guide demonstrates complete expense management workflows including:

1. Tracking business expenses with categories
2. Creating billable expenses for clients
3. Managing vendor bills and payments
4. Recording receipts and documentation

---

## Workflow 1: Recording Business Expenses

Track expenses for tax purposes and financial reporting.

### Step 1: List Available Expense Categories

Find the appropriate category for your expense.

**Tool Call:**
```json
{
  "tool": "expensecategory_list",
  "input": {
    "accountId": "ABC123"
  }
}
```

**Response:**
```json
{
  "categories": [
    {
      "id": 1,
      "category": "Office Expenses",
      "visState": 0
    },
    {
      "id": 2,
      "category": "Travel",
      "visState": 0
    },
    {
      "id": 3,
      "category": "Equipment",
      "visState": 0
    },
    {
      "id": 4,
      "category": "Software",
      "visState": 0
    },
    {
      "id": 5,
      "category": "Meals & Entertainment",
      "visState": 0
    }
  ]
}
```

### Step 2: Get Current User ID

Get your staff ID for expense tracking.

**Tool Call:**
```json
{
  "tool": "user_me",
  "input": {
    "accountId": "ABC123"
  }
}
```

**Response:**
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "role": "owner"
}
```

### Step 3: Create Business Expense

Record an expense for office supplies.

**Tool Call:**
```json
{
  "tool": "expense_create",
  "input": {
    "accountId": "ABC123",
    "categoryId": 1,
    "staffId": 1,
    "date": "2024-12-15T00:00:00Z",
    "amount": {
      "amount": "125.50",
      "code": "USD"
    },
    "vendor": "Office Supply Co",
    "notes": "Printer cartridges, paper, and pens for office"
  }
}
```

**Response:**
```json
{
  "id": 77777,
  "categoryId": 1,
  "staffId": 1,
  "date": "2024-12-15T00:00:00Z",
  "amount": {
    "amount": "125.50",
    "code": "USD"
  },
  "vendor": "Office Supply Co",
  "notes": "Printer cartridges, paper, and pens for office",
  "status": "outstanding",
  "hasReceipt": false,
  "visState": 0
}
```

**Result:** Expense is tracked for tax purposes and financial reporting.

---

## Workflow 2: Billable Expenses to Clients

Track expenses that will be billed to clients with markup.

### Step 1: Find Client and Project

Get the client and project IDs for billing.

**Tool Call:**
```json
{
  "tool": "client_list",
  "input": {
    "accountId": "ABC123",
    "organization": "Acme Corp"
  }
}
```

**Response:**
```json
{
  "clients": [
    {
      "id": 12345,
      "organization": "Acme Corp",
      "email": "billing@acmecorp.com"
    }
  ]
}
```

**Tool Call:**
```json
{
  "tool": "project_list",
  "input": {
    "accountId": "ABC123",
    "clientId": 12345
  }
}
```

**Response:**
```json
{
  "projects": [
    {
      "id": 42,
      "title": "Website Redesign",
      "clientId": 12345,
      "active": true
    }
  ]
}
```

### Step 2: Create Billable Expense with Markup

**Tool Call:**
```json
{
  "tool": "expense_create",
  "input": {
    "accountId": "ABC123",
    "categoryId": 4,
    "staffId": 1,
    "date": "2024-12-15T00:00:00Z",
    "amount": {
      "amount": "89.99",
      "code": "USD"
    },
    "vendor": "Adobe",
    "notes": "Stock photos for client website",
    "clientId": 12345,
    "projectId": 42,
    "markupPercent": 15
  }
}
```

**Calculation:**
- Cost: $89.99
- Markup: 15% of $89.99 = $13.50
- **Client will be billed:** $103.49

**Response:**
```json
{
  "id": 77778,
  "categoryId": 4,
  "staffId": 1,
  "date": "2024-12-15T00:00:00Z",
  "amount": {
    "amount": "89.99",
    "code": "USD"
  },
  "vendor": "Adobe",
  "notes": "Stock photos for client website",
  "clientId": 12345,
  "projectId": 42,
  "status": "outstanding",
  "markupPercent": 15,
  "hasReceipt": false
}
```

### Step 3: List Unbilled Expenses for Client

Find all expenses ready to invoice.

**Tool Call:**
```json
{
  "tool": "expense_list",
  "input": {
    "accountId": "ABC123",
    "clientId": 12345,
    "status": "outstanding"
  }
}
```

**Response:**
```json
{
  "expenses": [
    {
      "id": 77778,
      "amount": {
        "amount": "89.99",
        "code": "USD"
      },
      "vendor": "Adobe",
      "notes": "Stock photos for client website",
      "clientId": 12345,
      "projectId": 42,
      "markupPercent": 15,
      "status": "outstanding"
    },
    {
      "id": 77779,
      "amount": {
        "amount": "45.00",
        "code": "USD"
      },
      "vendor": "FontShop",
      "notes": "Premium fonts for website",
      "clientId": 12345,
      "markupPercent": 15,
      "status": "outstanding"
    }
  ]
}
```

**Total to bill:**
- Adobe stock: $89.99 + 15% = $103.49
- Fonts: $45.00 + 15% = $51.75
- **Total: $155.24**

### Step 4: Create Invoice with Expenses

**Tool Call:**
```json
{
  "tool": "invoice_create",
  "input": {
    "accountId": "ABC123",
    "customerId": 12345,
    "createDate": "2024-12-21",
    "dueDate": "2025-01-20",
    "lines": [
      {
        "name": "Reimbursable Expenses - December 2024",
        "description": "Stock photos: $103.49\nPremium fonts: $51.75",
        "qty": 1,
        "unitCost": {
          "amount": "155.24",
          "code": "USD"
        }
      }
    ],
    "notes": "Expenses incurred for your project, marked up 15%"
  }
}
```

**Response:**
```json
{
  "id": 98768,
  "invoiceNumber": "INV-2024-004",
  "amount": {
    "amount": "155.24",
    "code": "USD"
  },
  "status": "draft"
}
```

**Note:** After invoicing, manually update expenses in FreshBooks UI to mark as "invoiced".

---

## Workflow 3: Managing Vendor Bills

Track bills you owe to suppliers and vendors.

### Step 1: Create or Find Vendor

**Tool Call:**
```json
{
  "tool": "billvendor_create",
  "input": {
    "accountId": "ABC123",
    "vendorName": "Office Supply Co",
    "email": "billing@officesupply.com",
    "phone": "+1-555-0300",
    "website": "https://officesupply.com",
    "currencyCode": "USD",
    "language": "en",
    "street": "789 Industrial Pkwy",
    "city": "Chicago",
    "province": "IL",
    "postalCode": "60601",
    "country": "USA"
  }
}
```

**Response:**
```json
{
  "id": 555,
  "vendorName": "Office Supply Co",
  "email": "billing@officesupply.com",
  "phone": "+1-555-0300",
  "currencyCode": "USD",
  "street": "789 Industrial Pkwy",
  "city": "Chicago",
  "province": "IL",
  "postalCode": "60601",
  "country": "USA"
}
```

### Step 2: Create Bill from Vendor

Record a bill you received.

**Tool Call:**
```json
{
  "tool": "bill_create",
  "input": {
    "accountId": "ABC123",
    "vendorId": 555,
    "issueDate": "2024-12-15T00:00:00Z",
    "dueDate": "2025-01-15T00:00:00Z",
    "billNumber": "INV-2024-5678",
    "amount": {
      "amount": "2500.00",
      "code": "USD"
    },
    "notes": "Office furniture - 10 ergonomic chairs"
  }
}
```

**Response:**
```json
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
  "notes": "Office furniture - 10 ergonomic chairs"
}
```

### Step 3: List Unpaid Bills

Review all bills that need payment.

**Tool Call:**
```json
{
  "tool": "bill_list",
  "input": {
    "accountId": "ABC123",
    "status": "unpaid"
  }
}
```

**Response:**
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
      "dueDate": "2025-01-15T00:00:00Z",
      "status": "unpaid"
    },
    {
      "id": 889,
      "billNumber": "INV-2024-5679",
      "vendorId": 556,
      "amount": {
        "amount": "1200.00",
        "code": "USD"
      },
      "outstandingAmount": {
        "amount": "1200.00",
        "code": "USD"
      },
      "dueDate": "2025-01-10T00:00:00Z",
      "status": "unpaid"
    }
  ]
}
```

**Total payables:** $3,700 ($2,500 + $1,200)

### Step 4: Record Bill Payment

Pay a vendor bill.

**Tool Call:**
```json
{
  "tool": "billpayment_create",
  "input": {
    "accountId": "ABC123",
    "billId": 888,
    "amount": {
      "amount": "2500.00",
      "code": "USD"
    },
    "paymentDate": "2025-01-10T00:00:00Z",
    "paymentType": "Check",
    "note": "Check #5678"
  }
}
```

**Response:**
```json
{
  "id": 11111,
  "billId": 888,
  "amount": {
    "amount": "2500.00",
    "code": "USD"
  },
  "paymentDate": "2025-01-10T00:00:00Z",
  "paymentType": "Check",
  "note": "Check #5678"
}
```

### Step 5: Verify Bill Paid

**Tool Call:**
```json
{
  "tool": "bill_single",
  "input": {
    "accountId": "ABC123",
    "billId": 888
  }
}
```

**Response:**
```json
{
  "id": 888,
  "billNumber": "INV-2024-5678",
  "amount": {
    "amount": "2500.00",
    "code": "USD"
  },
  "outstandingAmount": {
    "amount": "0.00",
    "code": "USD"
  },
  "paidAmount": {
    "amount": "2500.00",
    "code": "USD"
  },
  "status": "paid"
}
```

**Result:** Bill is marked as paid, accounts payable reduced by $2,500.

---

## Workflow 4: Partial Bill Payment

When paying bills in installments.

### Step 1: Record First Payment

**Tool Call:**
```json
{
  "tool": "billpayment_create",
  "input": {
    "accountId": "ABC123",
    "billId": 889,
    "amount": {
      "amount": "500.00",
      "code": "USD"
    },
    "paymentDate": "2024-12-30T00:00:00Z",
    "paymentType": "Bank Transfer",
    "note": "First installment payment"
  }
}
```

**Response:**
```json
{
  "id": 11112,
  "billId": 889,
  "amount": {
    "amount": "500.00",
    "code": "USD"
  },
  "paymentType": "Bank Transfer"
}
```

### Step 2: Check Remaining Balance

**Tool Call:**
```json
{
  "tool": "bill_single",
  "input": {
    "accountId": "ABC123",
    "billId": 889
  }
}
```

**Response:**
```json
{
  "id": 889,
  "amount": {
    "amount": "1200.00",
    "code": "USD"
  },
  "outstandingAmount": {
    "amount": "700.00",
    "code": "USD"
  },
  "paidAmount": {
    "amount": "500.00",
    "code": "USD"
  },
  "status": "partial"
}
```

**Remaining:** $700 still owed

### Step 3: Record Final Payment

**Tool Call:**
```json
{
  "tool": "billpayment_create",
  "input": {
    "accountId": "ABC123",
    "billId": 889,
    "amount": {
      "amount": "700.00",
      "code": "USD"
    },
    "paymentDate": "2025-01-15T00:00:00Z",
    "paymentType": "Bank Transfer",
    "note": "Final payment"
  }
}
```

**Result:** Bill status changes to "paid".

---

## Workflow 5: Expense Reporting and Review

### Step 1: Review Expenses by Category

**Tool Call:**
```json
{
  "tool": "expense_list",
  "input": {
    "accountId": "ABC123",
    "categoryId": 2,
    "dateFrom": "2024-12-01T00:00:00Z",
    "dateTo": "2024-12-31T23:59:59Z"
  }
}
```

**Response:**
```json
{
  "expenses": [
    {
      "id": 77780,
      "categoryId": 2,
      "date": "2024-12-05T00:00:00Z",
      "amount": {
        "amount": "450.00",
        "code": "USD"
      },
      "vendor": "United Airlines",
      "notes": "Flight to client meeting - NYC"
    },
    {
      "id": 77781,
      "categoryId": 2,
      "date": "2024-12-05T00:00:00Z",
      "amount": {
        "amount": "200.00",
        "code": "USD"
      },
      "vendor": "Hilton Hotels",
      "notes": "Hotel - 1 night NYC"
    },
    {
      "id": 77782,
      "categoryId": 2,
      "date": "2024-12-06T00:00:00Z",
      "amount": {
        "amount": "75.00",
        "code": "USD"
      },
      "vendor": "Uber",
      "notes": "Airport and client office transportation"
    }
  ]
}
```

**Total travel expenses for December:** $725

### Step 2: Update Expense Details

Add missing information or correct errors.

**Tool Call:**
```json
{
  "tool": "expense_update",
  "input": {
    "accountId": "ABC123",
    "expenseId": 77780,
    "notes": "Flight to client meeting - NYC (return flight included)"
  }
}
```

### Step 3: List Expenses by Vendor

Track spending with specific vendors.

**Tool Call:**
```json
{
  "tool": "expense_list",
  "input": {
    "accountId": "ABC123",
    "vendor": "Office Supply",
    "dateFrom": "2024-01-01T00:00:00Z",
    "dateTo": "2024-12-31T23:59:59Z"
  }
}
```

**Response:**
```json
{
  "expenses": [
    {
      "id": 77777,
      "amount": {
        "amount": "125.50",
        "code": "USD"
      },
      "vendor": "Office Supply Co",
      "date": "2024-12-15T00:00:00Z"
    },
    {
      "id": 77783,
      "amount": {
        "amount": "89.99",
        "code": "USD"
      },
      "vendor": "Office Supply Co",
      "date": "2024-11-10T00:00:00Z"
    }
  ]
}
```

**Total spent with Office Supply Co:** $215.49

---

## Common Variations

### Variation 1: Expense with Tax

Record expense with sales tax included.

**Tool Call:**
```json
{
  "tool": "expense_create",
  "input": {
    "accountId": "ABC123",
    "categoryId": 3,
    "staffId": 1,
    "date": "2024-12-15T00:00:00Z",
    "amount": {
      "amount": "1500.00",
      "code": "USD"
    },
    "vendor": "Dell",
    "notes": "Laptop for new employee",
    "taxName1": "Sales Tax",
    "taxPercent1": "8.5"
  }
}
```

**Calculation:**
- Base amount: $1,500
- Sales tax (8.5%): $127.50
- **Total: $1,627.50**

### Variation 2: Expense with Receipt Attachment

Note that receipt was attached (attachment upload handled in FreshBooks UI).

**Tool Call:**
```json
{
  "tool": "expense_create",
  "input": {
    "accountId": "ABC123",
    "categoryId": 5,
    "staffId": 1,
    "date": "2024-12-15T00:00:00Z",
    "amount": {
      "amount": "85.00",
      "code": "USD"
    },
    "vendor": "The Steakhouse",
    "notes": "Client dinner meeting - receipt attached"
  }
}
```

### Variation 3: Non-Billable Client Expense

Expense for client that won't be billed (marketing, relationship building).

**Tool Call:**
```json
{
  "tool": "expense_create",
  "input": {
    "accountId": "ABC123",
    "categoryId": 5,
    "staffId": 1,
    "date": "2024-12-15T00:00:00Z",
    "amount": {
      "amount": "150.00",
      "code": "USD"
    },
    "vendor": "Restaurant",
    "notes": "Holiday thank-you dinner with client",
    "clientId": 12345
  }
}
```

**Note:** No `markupPercent` means expense tracked for client but not billable.

---

## Error Handling Tips

### Error: Invalid Category ID

**Error Response:**
```json
{
  "error": {
    "code": -32013,
    "message": "Invalid category ID: 99 does not exist"
  }
}
```

**Recovery:**
1. Call `expensecategory_list` to get valid categories
2. Retry with correct category ID

### Error: Cannot Update Invoiced Expense

**Error Response:**
```json
{
  "error": {
    "code": -32007,
    "message": "Cannot update expense that has been invoiced"
  }
}
```

**Recovery:**
- Invoiced expenses are locked
- Create credit note if correction needed
- Create new expense entry for adjustments

### Error: Invalid Vendor ID

**Error Response:**
```json
{
  "error": {
    "code": -32013,
    "message": "Invalid vendor ID: 999 does not exist"
  }
}
```

**Recovery:**
1. Call `billvendor_list` to find vendor
2. Or call `billvendor_create` to create new vendor
3. Retry with valid vendor ID

---

## Best Practices

1. **Categorize consistently** - Use standard categories for better reporting
2. **Track all receipts** - Document expenses for tax and audit purposes
3. **Record expenses promptly** - Don't wait until month-end
4. **Use vendor names** - Helps track spending patterns
5. **Mark billable expenses** - Set clientId and markup when appropriate
6. **Review monthly** - Check expense reports for accuracy
7. **Separate personal/business** - Only business expenses in FreshBooks
8. **Note tax-deductible items** - Add details for tax preparation
9. **Track mileage separately** - Use mileage rates for vehicle expenses
10. **Regular vendor bill review** - Don't miss payment deadlines

---

## Expense Category Examples

Common categories and their uses:

| Category | Examples |
|----------|----------|
| Office Expenses | Supplies, furniture, postage |
| Travel | Flights, hotels, car rentals |
| Equipment | Computers, phones, tools |
| Software | SaaS subscriptions, licenses |
| Meals & Entertainment | Client meals, team events |
| Marketing | Advertising, promotional items |
| Professional Services | Legal, accounting, consulting |
| Utilities | Internet, phone, electricity |
| Insurance | Business insurance premiums |
| Rent | Office space, storage |

---

## Markup Guidelines

Common markup percentages for billable expenses:

| Expense Type | Typical Markup | Reasoning |
|--------------|----------------|-----------|
| Direct materials | 10-20% | Handling and procurement |
| Software licenses | 0-15% | Pass-through or small admin fee |
| Travel expenses | 0-10% | Usually minimal markup |
| Professional services | 15-25% | Management overhead |
| Equipment purchases | 20-30% | Research and procurement |

**Note:** Markup policies should be transparent and agreed with clients.

---

## Bill Payment Methods

Common payment types for vendor bills:

- **Check** - Paper check
- **Bank Transfer** - Wire transfer or ACH
- **Credit Card** - Corporate credit card
- **Debit Card** - Business debit card
- **Cash** - Cash payment
- **PayPal** - PayPal business account
- **Other** - Other payment methods

---

## Tax Deduction Tips

Track these details for tax purposes:

1. **Date** - When expense occurred
2. **Amount** - Total cost including tax
3. **Vendor** - Who you paid
4. **Business purpose** - Why it was necessary
5. **Receipt** - Documentation proof
6. **Category** - Type of expense
7. **Client** - If client-related
8. **Project** - If project-specific

**Always consult a tax professional for specific deduction guidance.**
