# FreshBooks MCP Workflow Examples

Complete, practical examples for common FreshBooks workflows using the MCP server.

## Overview

This directory contains step-by-step workflow examples that demonstrate how to use the FreshBooks MCP tools for real-world business scenarios. Each example includes:

- Complete tool call sequences
- Sample inputs and outputs
- Common variations
- Error handling strategies
- Best practices

## Available Workflows

### [Time Tracking Workflow](./time-tracking-workflow.md)

Learn how to track time from start to finish:

- **Timer-Based Tracking** - Start/stop timers for active work
- **Manual Time Entry** - Log completed time retroactively
- **Task Association** - Link time to specific project tasks
- **Billing Time** - Convert tracked time to client invoices
- **Time Review** - List, edit, and manage time entries

**Use when:** Tracking billable hours, logging project time, managing active timers

### [Invoicing Workflow](./invoicing-workflow.md)

Complete invoice lifecycle from creation to payment:

- **Client Setup** - Create and find client records
- **Invoice Creation** - Build invoices with line items
- **Tax Handling** - Apply sales tax and VAT
- **Payment Recording** - Track full and partial payments
- **Multi-Currency** - Invoice international clients
- **Invoice Updates** - Correct and modify invoices

**Use when:** Billing clients, recording payments, managing accounts receivable

### [Expense Management](./expense-management.md)

Track business expenses and vendor bills:

- **Business Expenses** - Record expenses by category
- **Billable Expenses** - Track client-reimbursable costs
- **Vendor Bills** - Manage accounts payable
- **Bill Payments** - Record payments to vendors
- **Expense Reporting** - Review and analyze spending

**Use when:** Tracking costs, managing vendors, preparing tax deductions

### [Financial Reporting](./reporting-workflow.md)

Generate reports for business insights:

- **Profit & Loss** - Monthly, quarterly, and annual P&L statements
- **Payments Collected** - Cash flow and revenue tracking
- **Tax Summaries** - Sales tax and compliance reporting
- **Performance Analysis** - Compare periods and identify trends
- **Client Revenue** - Top client analysis

**Use when:** Monthly reviews, tax preparation, business planning, investor reporting

---

## Quick Start Guide

### 1. Authentication First

All workflows require authentication. Start here:

```json
{
  "tool": "auth_get_url",
  "input": {
    "clientId": "your-client-id"
  }
}
```

Follow the authorization flow to get an access token.

### 2. Get Account ID

Most tools require an `accountId`:

```json
{
  "tool": "account_list",
  "input": {}
}
```

Save the account ID from the response.

### 3. Choose Your Workflow

Pick a workflow based on what you need to accomplish:

| Task | Workflow |
|------|----------|
| Track work hours | [Time Tracking](./time-tracking-workflow.md) |
| Bill a client | [Invoicing](./invoicing-workflow.md) |
| Record an expense | [Expense Management](./expense-management.md) |
| Check financials | [Reporting](./reporting-workflow.md) |

---

## Common Workflow Patterns

### Daily Operations

**Morning:**
1. Check for active timers (`timer_current`)
2. Start timer for first task (`timer_start`)
3. Review unpaid invoices (`invoice_list` with status filter)

**During Day:**
4. Stop/start timers as tasks change
5. Record expenses as incurred (`expense_create`)
6. Respond to client payment notifications

**Evening:**
7. Stop final timer (`timer_stop`)
8. Review time entries for day (`timeentry_list`)
9. Record any manual time entries

### Weekly Tasks

**Monday:**
1. Review last week's time entries
2. Create invoices for completed work
3. Send invoice links to clients

**Mid-Week:**
4. Record vendor bill payments
5. Track business expenses
6. Follow up on overdue invoices

**Friday:**
7. Review week's cash flow
8. Prepare next week's project tasks
9. Update client records as needed

### Monthly Tasks

**Week 1:**
1. Generate profit & loss report for previous month
2. Review payments collected
3. Analyze expense categories

**Week 2:**
4. Send monthly recurring invoices
5. Review aging reports for receivables
6. Pay monthly vendor bills

**Week 3:**
7. Update client relationships
8. Review project profitability
9. Plan next month's work

**Week 4:**
10. Prepare for month-end close
11. Reconcile accounts
12. Archive completed projects

### Quarterly Tasks

1. Run quarterly P&L report
2. Generate tax summary report
3. Review top clients by revenue
4. Analyze expense trends
5. Prepare estimated tax payments
6. Strategic planning session

---

## Workflow Integration Examples

### Project-Based Workflow

Complete flow for a client project:

1. **Setup:**
   - Create client (`client_create`)
   - Create project (`project_create`)
   - Set up project tasks (`task_create`)

2. **Execution:**
   - Track time daily (`timer_start`, `timer_stop`)
   - Record project expenses (`expense_create` with projectId)
   - Associate all work with project

3. **Billing:**
   - List unbilled time (`timeentry_list` with billed=false)
   - List billable expenses (`expense_list` with status=outstanding)
   - Create comprehensive invoice (`invoice_create`)
   - Share invoice with client (`invoice_share_link`)

4. **Collection:**
   - Record payment when received (`payment_create`)
   - Mark project as complete

### Retainer Client Workflow

Managing recurring monthly retainers:

1. **Setup:**
   - Create client with retainer details
   - Set up recurring service item (`item_create`)

2. **Monthly:**
   - Track hours against retainer
   - Create monthly invoice (same structure each month)
   - Apply retainer payment
   - Track overage hours separately

3. **Reporting:**
   - Compare actual vs. retainer hours
   - Generate monthly summary
   - Identify trending overages

### Multi-Client Workflow

Managing multiple active clients:

1. **Morning:**
   - Review priorities across all clients
   - Start timer for first client's work

2. **Throughout Day:**
   - Switch timers between clients
   - Track context-switching overhead
   - Note client-specific details

3. **Billing:**
   - Group time by client
   - Separate billable vs. non-billable
   - Create client-specific invoices

---

## Error Recovery Patterns

### Authentication Expired

**Error:** `-32001 Not authenticated`

**Recovery:**
```
1. Check auth status (auth_status)
2. Token auto-refreshes in background
3. Retry original request
4. If still failing, re-authenticate
```

### Resource Not Found

**Error:** `-32005 Resource not found`

**Recovery:**
```
1. Verify ID exists via list tool
2. Check for typos in ID
3. Ensure resource not deleted
4. Use search to find correct ID
```

### Validation Errors

**Error:** `-32602 Invalid parameters`

**Recovery:**
```
1. Review input schema in API docs
2. Check required fields present
3. Validate data formats (dates, amounts)
4. Ensure IDs are integers where required
```

### Rate Limiting

**Error:** `-32004 Rate limit exceeded`

**Recovery:**
```
1. Wait 60 seconds before retry
2. Reduce request frequency
3. Batch operations where possible
4. Implement exponential backoff
```

---

## Best Practices Across Workflows

### Data Entry

1. **Be Consistent** - Use standard naming and formatting
2. **Be Detailed** - Add descriptive notes to entries
3. **Be Timely** - Enter data same day when possible
4. **Be Accurate** - Double-check amounts and dates

### Organization

1. **Use Categories** - Properly categorize all entries
2. **Use Projects** - Group related work
3. **Use Tasks** - Break down project details
4. **Use Notes** - Document context and decisions

### Financial Management

1. **Track Everything** - Don't miss expenses or time
2. **Bill Promptly** - Send invoices as soon as work completes
3. **Follow Up** - Monitor outstanding invoices
4. **Review Regularly** - Check reports monthly minimum

### Compliance

1. **Keep Receipts** - Document all expenses
2. **Track Taxes** - Record tax collected and paid
3. **Categorize Properly** - Use correct expense categories
4. **Maintain Records** - Keep 7 years for tax purposes

---

## Tool Reference Quick Links

### Time & Timers
- [timeentry_list](../api/time-entries.md#timeentry_list)
- [timeentry_create](../api/time-entries.md#timeentry_create)
- [timer_start](../api/timers.md#timer_start)
- [timer_stop](../api/timers.md#timer_stop)

### Invoicing & Payments
- [invoice_create](../api/invoices.md#invoice_create)
- [invoice_list](../api/invoices.md#invoice_list)
- [payment_create](../api/payments.md#payment_create)
- [client_create](../api/clients.md#client_create)

### Expenses & Bills
- [expense_create](../api/expenses.md#expense_create)
- [bill_create](../api/bills.md#bill_create)
- [billpayment_create](../api/bill-payments.md#billpayment_create)

### Reports
- [report_profit_loss](../api/reports.md#report_profit_loss)
- [report_payments_collected](../api/reports.md#report_payments_collected)
- [report_tax_summary](../api/reports.md#report_tax_summary)

---

## Getting Help

### Documentation Resources

- **API Reference:** See `docs/api/` for detailed tool documentation
- **Claude Docs:** See `docs/claude/` for Claude-optimized guidance
- **Examples:** This directory for workflow examples

### Common Issues

**Issue:** Can't find client/project ID
- **Solution:** Use list tools to search by name

**Issue:** Timer already running error
- **Solution:** Use `timer_current` to find and stop existing timer

**Issue:** Invoice won't update
- **Solution:** Can only update draft invoices; sent invoices are restricted

**Issue:** Payment exceeds invoice
- **Solution:** Check current outstanding balance with `invoice_single`

---

## Workflow Checklist Templates

### New Client Onboarding

- [ ] Create client record
- [ ] Set up client project(s)
- [ ] Configure billing rates
- [ ] Create service items
- [ ] Set payment terms
- [ ] Document project scope
- [ ] Start time tracking

### Month-End Close

- [ ] Stop all active timers
- [ ] Review all time entries
- [ ] Record remaining expenses
- [ ] Generate client invoices
- [ ] Send invoice links
- [ ] Record payments received
- [ ] Pay vendor bills
- [ ] Run financial reports
- [ ] Review KPIs
- [ ] Plan next month

### Tax Preparation (Quarterly)

- [ ] Run P&L report for quarter
- [ ] Run tax summary report
- [ ] Review expense categories
- [ ] Verify revenue recognition
- [ ] Calculate estimated tax
- [ ] Prepare payment
- [ ] File tax forms
- [ ] Document in records

---

## Tips for Success

1. **Start Simple** - Master basic workflows before advanced features
2. **Stay Consistent** - Use same process each time
3. **Review Often** - Weekly minimum for time and expenses
4. **Plan Ahead** - Schedule recurring tasks
5. **Automate Where Possible** - Use recurring invoices and items
6. **Keep Learning** - Explore new tools and features
7. **Ask Questions** - Reference documentation when stuck
8. **Backup Data** - Export reports regularly

---

## Next Steps

1. **Read the workflow** that matches your immediate need
2. **Follow step-by-step** examples with your actual data
3. **Experiment safely** with draft records first
4. **Build your routine** around these patterns
5. **Customize workflows** to fit your business

---

**Remember:** These workflows are templates. Adapt them to match your specific business processes and needs.
