/**
 * Tool registration and exports
 *
 * This file exports all FreshBooks MCP tools for registration with the server.
 */

// Tool metadata types and registry (for hosted server permissions)
export * from "./types.js";
export * from "./metadata.js";

// TimeEntry tools (time tracking)
export * from "./time-entry/index.js";

// Timer tools (time tracking)
export * from "./timer/index.js";

// Project tools (project management)
export * from "./project/index.js";

// Service tools (billable services)
export * from "./service/index.js";

// Task tools (project tasks)
export * from "./task/index.js";

// Client tools (customer management)
export * from "./client/index.js";

// Invoice tools (billing)
export * from "./invoice/index.js";

// Payment tools (payment tracking)
export * from "./payment/index.js";

// Expense tools (expense tracking)
export * from "./expense/index.js";

// ExpenseCategory tools (expense categories - read-only)
export * from "./expense-category/index.js";

// Item tools (reusable invoice line items)
export * from "./item/index.js";

// Bill tools (vendor bills)
export * from "./bill/index.js";

// BillPayment tools (vendor bill payments)
export * from "./bill-payment/index.js";

// BillVendor tools (vendor/supplier management)
export * from "./bill-vendor/index.js";

// CreditNote tools (credits and refunds)
export * from "./credit-note/index.js";

// OtherIncome tools (non-invoice income tracking)
export * from "./other-income/index.js";

// JournalEntry tools (accounting journal entries)
export * from "./journal-entry/index.js";

// JournalEntryAccount tools (chart of accounts - read-only)
export * from "./journal-entry-account/index.js";

// User tools (user account information)
export * from "./user/index.js";

// Report tools (financial reports)
export * from "./report/index.js";

// PaymentOptions tools (payment gateway configuration)
export * from "./payment-options/index.js";

// Callback tools (webhook management)
export * from "./callback/index.js";

// Export count for validation
export const TIME_ENTRY_TOOLS_COUNT = 5;
export const TIMER_TOOLS_COUNT = 4;
export const PROJECT_TOOLS_COUNT = 5;
export const SERVICE_TOOLS_COUNT = 5; // list, single, create, rate_get, rate_set
export const TASK_TOOLS_COUNT = 5; // list, single, create, update, delete
export const CLIENT_TOOLS_COUNT = 5; // list, single, create, update, delete
export const INVOICE_TOOLS_COUNT = 6; // list, single, create, update, delete, share_link
export const PAYMENT_TOOLS_COUNT = 5; // list, single, create, update, delete
export const EXPENSE_TOOLS_COUNT = 5; // list, single, create, update, delete
export const EXPENSE_CATEGORY_TOOLS_COUNT = 2; // list, single (read-only)
export const ITEM_TOOLS_COUNT = 4; // list, single, create, update
export const BILL_TOOLS_COUNT = 5; // list, single, create, delete, archive
export const BILL_PAYMENT_TOOLS_COUNT = 5; // list, single, create, update, delete
export const BILL_VENDOR_TOOLS_COUNT = 5; // list, single, create, update, delete
export const CREDIT_NOTE_TOOLS_COUNT = 5; // list, single, create, update, delete
export const OTHER_INCOME_TOOLS_COUNT = 5; // list, single, create, update, delete
export const JOURNAL_ENTRY_TOOLS_COUNT = 1; // create (create-only)
export const JOURNAL_ENTRY_ACCOUNT_TOOLS_COUNT = 1; // list (read-only)
export const USER_TOOLS_COUNT = 1; // me (user info)
export const REPORT_TOOLS_COUNT = 3; // payments_collected, profit_loss, tax_summary
export const PAYMENT_OPTIONS_TOOLS_COUNT = 3; // single, create, default
export const CALLBACK_TOOLS_COUNT = 7; // list, single, create, update, delete, verify, resend_verification
export const TOTAL_TOOLS_COUNT =
  TIME_ENTRY_TOOLS_COUNT +
  TIMER_TOOLS_COUNT +
  PROJECT_TOOLS_COUNT +
  SERVICE_TOOLS_COUNT +
  TASK_TOOLS_COUNT +
  CLIENT_TOOLS_COUNT +
  INVOICE_TOOLS_COUNT +
  PAYMENT_TOOLS_COUNT +
  EXPENSE_TOOLS_COUNT +
  EXPENSE_CATEGORY_TOOLS_COUNT +
  ITEM_TOOLS_COUNT +
  BILL_TOOLS_COUNT +
  BILL_PAYMENT_TOOLS_COUNT +
  BILL_VENDOR_TOOLS_COUNT +
  CREDIT_NOTE_TOOLS_COUNT +
  OTHER_INCOME_TOOLS_COUNT +
  JOURNAL_ENTRY_TOOLS_COUNT +
  JOURNAL_ENTRY_ACCOUNT_TOOLS_COUNT +
  USER_TOOLS_COUNT +
  REPORT_TOOLS_COUNT +
  PAYMENT_OPTIONS_TOOLS_COUNT +
  CALLBACK_TOOLS_COUNT;
