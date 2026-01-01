# FreshBooks MCP API Reference

Complete reference documentation for all tools provided by the FreshBooks MCP server.

## Overview

The FreshBooks MCP server provides tools for interacting with FreshBooks for time tracking, project management, and billing. All tools follow consistent patterns for input validation, error handling, and authentication.

## Tool Categories

### Authentication Tools

Manage OAuth2 authentication and account selection.

| Tool | Description |
|------|-------------|
| [auth_status](./authentication.md#auth_status) | Check current authentication status |
| [auth_get_url](./authentication.md#auth_get_url) | Get OAuth authorization URL |
| [auth_exchange_code](./authentication.md#auth_exchange_code) | Exchange authorization code for tokens |
| [auth_refresh](./authentication.md#auth_refresh) | Refresh expired access token |

### Time Entry Tools

Track and manage completed time entries.

| Tool | Description |
|------|-------------|
| [timeentry_list](./time-entries.md#timeentry_list) | List time entries with filtering |
| [timeentry_single](./time-entries.md#timeentry_single) | Get a single time entry by ID |
| [timeentry_create](./time-entries.md#timeentry_create) | Create a new time entry |
| [timeentry_update](./time-entries.md#timeentry_update) | Update an existing time entry |
| [timeentry_delete](./time-entries.md#timeentry_delete) | Delete a time entry |

### Timer Tools

Manage active running timers.

| Tool | Description |
|------|-------------|
| [timer_start](./timers.md#timer_start) | Start a new timer |
| [timer_stop](./timers.md#timer_stop) | Stop running timer and log time |
| [timer_current](./timers.md#timer_current) | Get currently running timer |
| [timer_discard](./timers.md#timer_discard) | Delete timer without logging |

### Project Tools

Manage projects for organizing work.

| Tool | Description |
|------|-------------|
| [project_list](./projects.md#project_list) | List projects with filtering |
| [project_single](./projects.md#project_single) | Get a single project by ID |
| [project_create](./projects.md#project_create) | Create a new project |
| [project_update](./projects.md#project_update) | Update an existing project |
| [project_delete](./projects.md#project_delete) | Delete a project |

### Service Tools

Manage billable service types.

| Tool | Description |
|------|-------------|
| [service_list](./services.md#service_list) | List available services |
| [service_single](./services.md#service_single) | Get a single service by ID |
| [service_create](./services.md#service_create) | Create a new service |
| [service_rate_get](./services.md#service_rate_get) | Get service billing rate |
| [service_rate_set](./services.md#service_rate_set) | Set service billing rate |

### Task Tools

Manage tasks within projects.

| Tool | Description |
|------|-------------|
| [task_list](./tasks.md#task_list) | List tasks with filtering |
| [task_single](./tasks.md#task_single) | Get a single task by ID |
| [task_create](./tasks.md#task_create) | Create a new task |
| [task_update](./tasks.md#task_update) | Update an existing task |
| [task_delete](./tasks.md#task_delete) | Delete a task |

### Client Tools

Manage clients and customers.

| Tool | Description |
|------|-------------|
| [client_list](./clients.md#client_list) | List clients with filtering |
| [client_single](./clients.md#client_single) | Get a single client by ID |
| [client_create](./clients.md#client_create) | Create a new client |
| [client_update](./clients.md#client_update) | Update an existing client |
| [client_delete](./clients.md#client_delete) | Delete a client |

### Invoice Tools

Create and manage invoices.

| Tool | Description |
|------|-------------|
| [invoice_list](./invoices.md#invoice_list) | List invoices with filtering |
| [invoice_single](./invoices.md#invoice_single) | Get a single invoice by ID |
| [invoice_create](./invoices.md#invoice_create) | Create a new invoice |
| [invoice_update](./invoices.md#invoice_update) | Update an existing invoice |
| [invoice_delete](./invoices.md#invoice_delete) | Delete an invoice |
| [invoice_share_link](./invoices.md#invoice_share_link) | Get shareable invoice link |

### Payment Tools

Track payments received from clients.

| Tool | Description |
|------|-------------|
| [payment_list](./payments.md#payment_list) | List payments with filtering |
| [payment_single](./payments.md#payment_single) | Get a single payment by ID |
| [payment_create](./payments.md#payment_create) | Record a new payment |
| [payment_update](./payments.md#payment_update) | Update an existing payment |
| [payment_delete](./payments.md#payment_delete) | Delete a payment |

### Expense Tools

Track and manage business expenses.

| Tool | Description |
|------|-------------|
| [expense_list](./expenses.md#expense_list) | List expenses with filtering |
| [expense_single](./expenses.md#expense_single) | Get a single expense by ID |
| [expense_create](./expenses.md#expense_create) | Record a new expense |
| [expense_update](./expenses.md#expense_update) | Update an existing expense |
| [expense_delete](./expenses.md#expense_delete) | Delete an expense |

### Expense Category Tools

View expense categories for classification.

| Tool | Description |
|------|-------------|
| [expensecategory_list](./expense-categories.md#expensecategory_list) | List expense categories |
| [expensecategory_single](./expense-categories.md#expensecategory_single) | Get a single category by ID |

### Item Tools

Manage reusable invoice line items.

| Tool | Description |
|------|-------------|
| [item_list](./items.md#item_list) | List items with filtering |
| [item_single](./items.md#item_single) | Get a single item by ID |
| [item_create](./items.md#item_create) | Create a new item |
| [item_update](./items.md#item_update) | Update an existing item |

### Bill Tools

Manage vendor bills (accounts payable).

| Tool | Description |
|------|-------------|
| [bill_list](./bills.md#bill_list) | List bills with filtering |
| [bill_single](./bills.md#bill_single) | Get a single bill by ID |
| [bill_create](./bills.md#bill_create) | Create a new bill |
| [bill_delete](./bills.md#bill_delete) | Delete a bill |
| [bill_archive](./bills.md#bill_archive) | Archive a bill |

### Bill Payment Tools

Track payments made to vendors.

| Tool | Description |
|------|-------------|
| [billpayment_list](./bill-payments.md#billpayment_list) | List bill payments with filtering |
| [billpayment_single](./bill-payments.md#billpayment_single) | Get a single bill payment by ID |
| [billpayment_create](./bill-payments.md#billpayment_create) | Record a new bill payment |
| [billpayment_update](./bill-payments.md#billpayment_update) | Update an existing bill payment |
| [billpayment_delete](./bill-payments.md#billpayment_delete) | Delete a bill payment |

### Bill Vendor Tools

Manage vendors and suppliers.

| Tool | Description |
|------|-------------|
| [billvendor_list](./bill-vendors.md#billvendor_list) | List vendors with filtering |
| [billvendor_single](./bill-vendors.md#billvendor_single) | Get a single vendor by ID |
| [billvendor_create](./bill-vendors.md#billvendor_create) | Create a new vendor |
| [billvendor_update](./bill-vendors.md#billvendor_update) | Update an existing vendor |
| [billvendor_delete](./bill-vendors.md#billvendor_delete) | Delete a vendor |

### Credit Note Tools

Issue credits to clients.

| Tool | Description |
|------|-------------|
| [creditnote_list](./credit-notes.md#creditnote_list) | List credit notes with filtering |
| [creditnote_single](./credit-notes.md#creditnote_single) | Get a single credit note by ID |
| [creditnote_create](./credit-notes.md#creditnote_create) | Create a new credit note |
| [creditnote_update](./credit-notes.md#creditnote_update) | Update an existing credit note |
| [creditnote_delete](./credit-notes.md#creditnote_delete) | Delete a credit note |

### Other Income Tools

Track non-invoice income.

| Tool | Description |
|------|-------------|
| [otherincome_list](./other-income.md#otherincome_list) | List other income with filtering |
| [otherincome_single](./other-income.md#otherincome_single) | Get a single income record by ID |
| [otherincome_create](./other-income.md#otherincome_create) | Record new income |
| [otherincome_update](./other-income.md#otherincome_update) | Update an existing income record |
| [otherincome_delete](./other-income.md#otherincome_delete) | Delete an income record |

### Journal Entry Tools

Create manual accounting entries.

| Tool | Description |
|------|-------------|
| [journalentry_create](./journal-entries.md#journalentry_create) | Create a new journal entry |

### Journal Entry Account Tools

View chart of accounts.

| Tool | Description |
|------|-------------|
| [journalentryaccount_list](./journal-entry-accounts.md#journalentryaccount_list) | List accounts from chart of accounts |

### Callback (Webhook) Tools

Manage webhook subscriptions.

| Tool | Description |
|------|-------------|
| [callback_list](./callbacks.md#callback_list) | List configured webhooks |
| [callback_single](./callbacks.md#callback_single) | Get a single webhook by ID |
| [callback_create](./callbacks.md#callback_create) | Create a new webhook |
| [callback_update](./callbacks.md#callback_update) | Update an existing webhook |
| [callback_delete](./callbacks.md#callback_delete) | Delete a webhook |
| [callback_verify](./callbacks.md#callback_verify) | Verify webhook ownership |
| [callback_resend_verification](./callbacks.md#callback_resend_verification) | Resend verification code |

### User Tools

Get authenticated user information.

| Tool | Description |
|------|-------------|
| [user_me](./users.md#user_me) | Get current user information |

### Payment Options Tools

Configure payment gateway settings.

| Tool | Description |
|------|-------------|
| [paymentoptions_single](./payment-options.md#paymentoptions_single) | Get payment options for invoice/estimate |
| [paymentoptions_create](./payment-options.md#paymentoptions_create) | Configure payment options |
| [paymentoptions_default](./payment-options.md#paymentoptions_default) | Get default payment options |

### Report Tools

Generate financial reports.

| Tool | Description |
|------|-------------|
| [report_payments_collected](./reports.md#report_payments_collected) | Payments collected report |
| [report_profit_loss](./reports.md#report_profit_loss) | Profit & loss report |
| [report_tax_summary](./reports.md#report_tax_summary) | Tax summary report |

## Common Patterns

### Authentication

All tools (except auth tools) require authentication. Use `accountId` from `auth_status` response.

```json
{
  "accountId": "ABC123"
}
```

### Pagination

List operations support pagination with consistent parameters:

```json
{
  "page": 1,
  "perPage": 30
}
```

Responses include pagination metadata:

```json
{
  "pagination": {
    "page": 1,
    "pages": 5,
    "perPage": 30,
    "total": 142
  }
}
```

### Filtering

List operations support entity-specific filters. See individual tool documentation for available filters.

### Error Handling

All tools return standardized MCP errors. See [Error Reference](./errors.md) for details.

## Resources

- [Error Reference](./errors.md) - Complete error code documentation
- [Schema Reference](./schemas.md) - Common schema definitions
- [FreshBooks API Documentation](https://www.freshbooks.com/api) - Official API docs
- [MCP Specification](https://modelcontextprotocol.io) - MCP protocol details

## Quick Reference

### Tool Count by Category

| Category | Tools | Description |
|----------|-------|-------------|
| Authentication | 4 | OAuth2 flow and token management |
| Time Entries | 5 | Completed time tracking |
| Timers | 4 | Active time tracking |
| Projects | 5 | Project management |
| Services | 5 | Billable service types |
| Tasks | 5 | Project subtasks |
| Clients | 5 | Customer management |
| Invoices | 6 | Invoice creation and management |
| Payments | 5 | Payment tracking |
| Expenses | 5 | Expense management |
| Expense Categories | 2 | Expense classification |
| Items | 4 | Reusable invoice items |
| Bills | 5 | Vendor bill management |
| Bill Payments | 5 | Vendor payment tracking |
| Bill Vendors | 5 | Vendor management |
| Credit Notes | 5 | Client credits |
| Other Income | 5 | Non-invoice revenue |
| Journal Entries | 1 | Manual accounting entries |
| Journal Entry Accounts | 1 | Chart of accounts |
| Callbacks | 7 | Webhook management |
| Users | 1 | User information |
| Payment Options | 3 | Payment gateway config |
| Reports | 3 | Financial reports |
| **Total** | **95** | **Complete FreshBooks API coverage** |

### Most Common Operations

**Start tracking time:**
```
1. timer_start({ accountId, projectId, note })
2. <do work>
3. timer_stop({ accountId, timeEntryId })
```

**Log completed time:**
```
timeentry_create({
  accountId,
  duration: 7200,  // 2 hours in seconds
  projectId: 42,
  note: "Feature development"
})
```

**Find time entries:**
```
timeentry_list({
  accountId,
  projectId: 42,
  startedAfter: "2024-12-01T00:00:00Z"
})
```

**Create project:**
```
project_create({
  accountId,
  title: "New Project",
  clientId: "100",
  rate: "125.00",
  billingMethod: "service_rate"
})
```

## Version

Current SDK Version: 4.1.0
Server Version: 1.0.0
Generated: 2024-12-21
