# Invoicing Workflow

Complete examples for creating invoices and receiving payments in FreshBooks using the MCP server.

## Overview

This guide demonstrates the complete invoicing workflow from creating a client to receiving payment. It covers:

1. Creating or finding clients
2. Creating invoices with line items
3. Sharing invoices with clients
4. Recording payments

---

## Workflow 1: Complete Invoice Lifecycle

From client creation to payment receipt.

### Step 1: Create a Client

First, create the client who will receive the invoice (or find an existing one).

**Tool Call:**
```json
{
  "tool": "client_create",
  "input": {
    "accountId": "ABC123",
    "fName": "Jane",
    "lName": "Smith",
    "organization": "Smith Consulting LLC",
    "email": "jane@smithconsulting.com",
    "busPhone": "+1-555-0200",
    "pStreet": "456 Oak Avenue",
    "pCity": "San Francisco",
    "pProvince": "CA",
    "pCode": "94102",
    "pCountry": "USA",
    "currencyCode": "USD",
    "allowLateFees": true,
    "allowLateNotifications": true
  }
}
```

**Response:**
```json
{
  "id": 12345,
  "fName": "Jane",
  "lName": "Smith",
  "organization": "Smith Consulting LLC",
  "email": "jane@smithconsulting.com",
  "busPhone": "+1-555-0200",
  "pStreet": "456 Oak Avenue",
  "pCity": "San Francisco",
  "pProvince": "CA",
  "pCode": "94102",
  "pCountry": "USA",
  "currencyCode": "USD",
  "visState": 0
}
```

**Important:** Save the client `id` (12345) for the invoice.

---

### Step 2: Find Existing Client (Alternative)

If the client already exists, search for them.

**Tool Call:**
```json
{
  "tool": "client_list",
  "input": {
    "accountId": "ABC123",
    "organization": "Smith Consulting",
    "visState": 0
  }
}
```

**Response:**
```json
{
  "clients": [
    {
      "id": 12345,
      "organization": "Smith Consulting LLC",
      "email": "jane@smithconsulting.com"
    }
  ]
}
```

---

### Step 3: Create Invoice with Line Items

Create an invoice for services rendered.

**Tool Call:**
```json
{
  "tool": "invoice_create",
  "input": {
    "accountId": "ABC123",
    "customerId": 12345,
    "createDate": "2024-12-21",
    "dueDate": "2025-01-20",
    "currencyCode": "USD",
    "lines": [
      {
        "name": "Web Development",
        "description": "Homepage redesign and responsive layout",
        "qty": 40,
        "unitCost": {
          "amount": "125.00",
          "code": "USD"
        }
      },
      {
        "name": "Hosting Setup",
        "description": "Annual hosting and domain configuration",
        "qty": 1,
        "unitCost": {
          "amount": "500.00",
          "code": "USD"
        }
      }
    ],
    "notes": "Thank you for your business! Payment is due within 30 days.",
    "terms": "Net 30"
  }
}
```

**Input Details:**
- `customerId`: 12345 (from Step 1 or 2)
- `createDate`: Invoice date (today)
- `dueDate`: Payment deadline (30 days from now)
- `lines`: Array of billable items
  - Line 1: 40 hours × $125/hour = $5,000
  - Line 2: 1 × $500 = $500
  - **Total: $5,500**

**Response:**
```json
{
  "id": 98765,
  "invoiceNumber": "INV-2024-001",
  "customerId": 12345,
  "createDate": "2024-12-21",
  "dueDate": "2025-01-20",
  "amount": {
    "amount": "5500.00",
    "code": "USD"
  },
  "outstanding": {
    "amount": "5500.00",
    "code": "USD"
  },
  "paid": {
    "amount": "0.00",
    "code": "USD"
  },
  "status": "draft",
  "paymentStatus": "unpaid",
  "currencyCode": "USD",
  "lines": [
    {
      "name": "Web Development",
      "description": "Homepage redesign and responsive layout",
      "qty": 40,
      "amount": {
        "amount": "125.00",
        "code": "USD"
      }
    },
    {
      "name": "Hosting Setup",
      "description": "Annual hosting and domain configuration",
      "qty": 1,
      "amount": {
        "amount": "500.00",
        "code": "USD"
      }
    }
  ],
  "notes": "Thank you for your business! Payment is due within 30 days.",
  "terms": "Net 30",
  "organization": "Smith Consulting LLC",
  "email": "jane@smithconsulting.com"
}
```

**Important:** Save the invoice `id` (98765) for payment recording.

---

### Step 4: Get Shareable Invoice Link

Generate a link to share with the client for viewing and paying online.

**Tool Call:**
```json
{
  "tool": "invoice_share_link",
  "input": {
    "accountId": "ABC123",
    "invoiceId": 98765
  }
}
```

**Response:**
```json
{
  "shareLink": "https://my.freshbooks.com/invoice/abc123-98765",
  "invoiceId": 98765
}
```

**Usage:** Send this link to the client via email or messaging. The client can view the invoice and make payment online without logging in.

---

### Step 5: Record Payment Received

When the client pays, record the payment.

**Tool Call:**
```json
{
  "tool": "payment_create",
  "input": {
    "accountId": "ABC123",
    "invoiceId": 98765,
    "amount": {
      "amount": "5500.00",
      "code": "USD"
    },
    "date": "2025-01-15T10:30:00Z",
    "type": "Credit Card",
    "note": "Payment received via Stripe",
    "sendEmailReceipt": true
  }
}
```

**Response:**
```json
{
  "id": 55555,
  "invoiceId": 98765,
  "accountId": "ABC123",
  "amount": {
    "amount": "5500.00",
    "code": "USD"
  },
  "date": "2025-01-15T10:30:00Z",
  "type": "Credit Card",
  "note": "Payment received via Stripe",
  "clientId": 12345,
  "gateway": "stripe",
  "sendEmailReceipt": true
}
```

**Result:** The invoice is now marked as PAID, and the client receives an email receipt.

---

## Workflow 2: Invoice with Taxes

For businesses that need to charge sales tax or VAT.

### Step 1: Create Invoice with Tax

**Tool Call:**
```json
{
  "tool": "invoice_create",
  "input": {
    "accountId": "ABC123",
    "customerId": 12345,
    "createDate": "2024-12-21",
    "dueDate": "2025-01-20",
    "currencyCode": "USD",
    "lines": [
      {
        "name": "Consulting Services",
        "description": "Business strategy consultation - December 2024",
        "qty": 20,
        "unitCost": {
          "amount": "200.00",
          "code": "USD"
        },
        "taxName1": "Sales Tax",
        "taxAmount1": "8.5"
      }
    ],
    "notes": "Tax is calculated at 8.5%",
    "terms": "Net 30"
  }
}
```

**Calculation:**
- Line item: 20 hours × $200 = $4,000
- Sales tax: $4,000 × 8.5% = $340
- **Total: $4,340**

**Response:**
```json
{
  "id": 98766,
  "invoiceNumber": "INV-2024-002",
  "amount": {
    "amount": "4340.00",
    "code": "USD"
  },
  "lines": [
    {
      "name": "Consulting Services",
      "qty": 20,
      "amount": {
        "amount": "200.00",
        "code": "USD"
      },
      "taxName1": "Sales Tax",
      "taxAmount1": {
        "amount": "340.00",
        "code": "USD"
      }
    }
  ]
}
```

---

## Workflow 3: Partial Payment Handling

When a client pays part of an invoice.

### Step 1: Record First Partial Payment

**Tool Call:**
```json
{
  "tool": "payment_create",
  "input": {
    "accountId": "ABC123",
    "invoiceId": 98765,
    "amount": {
      "amount": "2500.00",
      "code": "USD"
    },
    "date": "2024-12-30T14:00:00Z",
    "type": "Check",
    "note": "Check #1234 - partial payment",
    "sendEmailReceipt": true
  }
}
```

**Response:**
```json
{
  "id": 55556,
  "invoiceId": 98765,
  "amount": {
    "amount": "2500.00",
    "code": "USD"
  },
  "type": "Check",
  "note": "Check #1234 - partial payment"
}
```

### Step 2: Check Invoice Status

**Tool Call:**
```json
{
  "tool": "invoice_single",
  "input": {
    "accountId": "ABC123",
    "invoiceId": 98765
  }
}
```

**Response:**
```json
{
  "id": 98765,
  "invoiceNumber": "INV-2024-001",
  "amount": {
    "amount": "5500.00",
    "code": "USD"
  },
  "outstanding": {
    "amount": "3000.00",
    "code": "USD"
  },
  "paid": {
    "amount": "2500.00",
    "code": "USD"
  },
  "status": "partial",
  "paymentStatus": "partial"
}
```

**Note:** Outstanding amount is now $3,000 (original $5,500 - $2,500 paid).

### Step 3: Record Final Payment

**Tool Call:**
```json
{
  "tool": "payment_create",
  "input": {
    "accountId": "ABC123",
    "invoiceId": 98765,
    "amount": {
      "amount": "3000.00",
      "code": "USD"
    },
    "date": "2025-01-15T10:30:00Z",
    "type": "Bank Transfer",
    "note": "Final payment - wire transfer",
    "sendEmailReceipt": true
  }
}
```

**Result:** Invoice is now fully paid.

---

## Workflow 4: Using Reusable Line Items

For frequently invoiced products or services.

### Step 1: Create Reusable Item

**Tool Call:**
```json
{
  "tool": "item_create",
  "input": {
    "accountId": "ABC123",
    "name": "Website Maintenance",
    "description": "Monthly website maintenance and updates",
    "unitCost": {
      "amount": "500.00",
      "code": "USD"
    },
    "qty": 1,
    "taxName1": "Sales Tax",
    "taxPercent1": "8.5"
  }
}
```

**Response:**
```json
{
  "id": 777,
  "name": "Website Maintenance",
  "description": "Monthly website maintenance and updates",
  "unitCost": {
    "amount": "500.00",
    "code": "USD"
  },
  "qty": 1,
  "taxName1": "Sales Tax",
  "taxPercent1": "8.5"
}
```

### Step 2: List Available Items

**Tool Call:**
```json
{
  "tool": "item_list",
  "input": {
    "accountId": "ABC123"
  }
}
```

**Response:**
```json
{
  "items": [
    {
      "id": 777,
      "name": "Website Maintenance",
      "unitCost": {
        "amount": "500.00",
        "code": "USD"
      }
    }
  ]
}
```

### Step 3: Create Invoice Using Item

**Tool Call:**
```json
{
  "tool": "invoice_create",
  "input": {
    "accountId": "ABC123",
    "customerId": 12345,
    "createDate": "2024-12-21",
    "dueDate": "2025-01-05",
    "lines": [
      {
        "name": "Website Maintenance",
        "description": "Monthly website maintenance and updates - December 2024",
        "qty": 1,
        "unitCost": {
          "amount": "500.00",
          "code": "USD"
        },
        "taxName1": "Sales Tax",
        "taxAmount1": "8.5"
      }
    ],
    "terms": "Due on receipt"
  }
}
```

**Benefit:** Consistent pricing and descriptions across invoices.

---

## Workflow 5: Invoice Corrections and Updates

### Step 1: Review Invoice Before Sending

**Tool Call:**
```json
{
  "tool": "invoice_single",
  "input": {
    "accountId": "ABC123",
    "invoiceId": 98765
  }
}
```

### Step 2: Update Draft Invoice

**Tool Call:**
```json
{
  "tool": "invoice_update",
  "input": {
    "accountId": "ABC123",
    "invoiceId": 98765,
    "dueDate": "2025-02-20",
    "notes": "Extended payment terms - thank you!",
    "lines": [
      {
        "name": "Web Development",
        "description": "Homepage redesign, responsive layout, and SEO optimization",
        "qty": 45,
        "unitCost": {
          "amount": "125.00",
          "code": "USD"
        }
      },
      {
        "name": "Hosting Setup",
        "description": "Annual hosting and domain configuration",
        "qty": 1,
        "unitCost": {
          "amount": "500.00",
          "code": "USD"
        }
      }
    ]
  }
}
```

**Changes:**
- Extended due date by one month
- Updated first line item from 40 to 45 hours
- Added SEO work to description
- New total: $6,125 (45 × $125 + $500)

**Response:**
```json
{
  "id": 98765,
  "invoiceNumber": "INV-2024-001",
  "amount": {
    "amount": "6125.00",
    "code": "USD"
  },
  "dueDate": "2025-02-20",
  "status": "draft"
}
```

**Important:** Can only update draft invoices. Sent invoices have restrictions.

---

## Workflow 6: Multi-Currency Invoicing

For international clients.

### Step 1: Create International Client

**Tool Call:**
```json
{
  "tool": "client_create",
  "input": {
    "accountId": "ABC123",
    "organization": "London Tech Ltd",
    "email": "billing@londontech.co.uk",
    "pCity": "London",
    "pCountry": "United Kingdom",
    "currencyCode": "GBP"
  }
}
```

**Response:**
```json
{
  "id": 12346,
  "organization": "London Tech Ltd",
  "currencyCode": "GBP"
}
```

### Step 2: Create Invoice in Client's Currency

**Tool Call:**
```json
{
  "tool": "invoice_create",
  "input": {
    "accountId": "ABC123",
    "customerId": 12346,
    "createDate": "2024-12-21",
    "dueDate": "2025-01-20",
    "currencyCode": "GBP",
    "lines": [
      {
        "name": "Software Development",
        "description": "API integration services",
        "qty": 30,
        "unitCost": {
          "amount": "95.00",
          "code": "GBP"
        }
      }
    ],
    "terms": "Net 30"
  }
}
```

**Response:**
```json
{
  "id": 98767,
  "invoiceNumber": "INV-2024-003",
  "amount": {
    "amount": "2850.00",
    "code": "GBP"
  },
  "currencyCode": "GBP"
}
```

**Total:** £2,850 (30 hours × £95/hour)

---

## Common Variations

### Variation 1: Invoice with Discount

Apply a percentage or fixed discount:

```json
{
  "tool": "invoice_create",
  "input": {
    "accountId": "ABC123",
    "customerId": 12345,
    "createDate": "2024-12-21",
    "lines": [
      {
        "name": "Annual Contract",
        "qty": 1,
        "unitCost": {
          "amount": "10000.00",
          "code": "USD"
        }
      }
    ],
    "discount": {
      "amount": "1000.00",
      "code": "USD"
    },
    "notes": "10% discount for annual prepayment"
  }
}
```

**Total:** $10,000 - $1,000 discount = $9,000

### Variation 2: Recurring Monthly Invoice

Create consistent monthly invoices:

```json
// January invoice
{
  "tool": "invoice_create",
  "input": {
    "accountId": "ABC123",
    "customerId": 12345,
    "createDate": "2024-01-01",
    "dueDate": "2024-01-15",
    "lines": [
      {
        "name": "Monthly Retainer",
        "description": "January 2024 - 20 hours included",
        "qty": 1,
        "unitCost": {
          "amount": "2500.00",
          "code": "USD"
        }
      }
    ]
  }
}

// February invoice (same structure, different dates)
{
  "tool": "invoice_create",
  "input": {
    "accountId": "ABC123",
    "customerId": 12345,
    "createDate": "2024-02-01",
    "dueDate": "2024-02-15",
    "lines": [
      {
        "name": "Monthly Retainer",
        "description": "February 2024 - 20 hours included",
        "qty": 1,
        "unitCost": {
          "amount": "2500.00",
          "code": "USD"
        }
      }
    ]
  }
}
```

### Variation 3: Invoice Based on Time Entries

Convert tracked time into invoice (see time-tracking-workflow.md for details):

```json
{
  "tool": "invoice_create",
  "input": {
    "accountId": "ABC123",
    "customerId": 100,
    "createDate": "2024-12-21",
    "dueDate": "2025-01-20",
    "lines": [
      {
        "name": "Development Services - December 2024",
        "description": "User authentication (2.5 hrs)\nClient meetings (3 hrs)\nTotal: 5.5 hours",
        "qty": 5.5,
        "unitCost": {
          "amount": "150.00",
          "code": "USD"
        }
      }
    ]
  }
}
```

---

## Error Handling Tips

### Error: Invalid Customer ID

**Error Response:**
```json
{
  "error": {
    "code": -32013,
    "message": "Invalid customer ID: 99999 does not exist"
  }
}
```

**Recovery:**
1. Call `client_list` to find the correct ID
2. Or call `client_create` to create the client first
3. Retry invoice creation with valid ID

### Error: Missing Required Fields

**Error Response:**
```json
{
  "error": {
    "code": -32602,
    "message": "Missing required field: lines array is empty"
  }
}
```

**Recovery:**
1. Ensure `lines` array has at least one item
2. Verify each line has `name` and `unitCost`
3. Retry with complete data

### Error: Cannot Update Sent Invoice

**Error Response:**
```json
{
  "error": {
    "code": -32007,
    "message": "Cannot update invoice that has been sent to client"
  }
}
```

**Recovery:**
- Sent invoices have restrictions
- For major changes, consider creating a credit note and new invoice
- Minor changes (like notes) may be allowed

### Error: Payment Exceeds Outstanding

**Error Response:**
```json
{
  "error": {
    "code": -32013,
    "message": "Payment amount $6000 exceeds outstanding balance $5500"
  }
}
```

**Recovery:**
1. Call `invoice_single` to check current outstanding amount
2. Record payment for exact outstanding amount
3. Handle overpayments as credit for future invoices

---

## Best Practices

1. **Create clients first** - Always have client record before invoicing
2. **Use detailed line items** - Clear descriptions help clients understand charges
3. **Set realistic due dates** - Typically Net 15, Net 30, or Net 60
4. **Include payment terms** - Specify late fees, early payment discounts
5. **Verify totals** - Double-check calculations before sending
6. **Use consistent numbering** - Let FreshBooks auto-generate invoice numbers
7. **Send professional notes** - Thank clients, include payment instructions
8. **Track payment status** - Regularly review outstanding invoices
9. **Record payments promptly** - Keep accounts receivable up to date
10. **Use items for recurring services** - Saves time and ensures consistency

---

## Invoice Status Reference

| Status | Description | Can Update? | Can Delete? |
|--------|-------------|-------------|-------------|
| draft | Not yet sent to client | Yes | Yes |
| sent | Sent but not viewed | Limited | No |
| viewed | Client has viewed | Limited | No |
| partial | Partially paid | No | No |
| paid | Fully paid | No | No |
| overdue | Past due date, unpaid | Limited | No |

---

## Payment Type Reference

Common payment types for recording:
- **Check** - Paper check/cheque
- **Cash** - Cash payment
- **Credit Card** - Credit card payment
- **Debit** - Debit card
- **Bank Transfer** - Wire transfer or ACH
- **PayPal** - PayPal payment
- **Stripe** - Stripe payment gateway
- **Other** - Other payment methods
