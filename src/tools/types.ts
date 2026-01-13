/**
 * Tool Metadata Types
 *
 * Defines types for tool metadata used by the hosted server
 * to categorize and filter tools based on user permissions.
 */

/**
 * Tool authorization tiers
 *
 * Defines the permission level required to execute a tool:
 * - read: Only reads data, no side effects
 * - write: Creates or modifies data
 * - delete: Permanently removes data (requires confirmation)
 * - admin: Administrative operations (webhooks, payment settings)
 */
export type ToolTier = 'read' | 'write' | 'delete' | 'admin';

/**
 * Tool categories matching FreshBooks resource types
 */
export type ToolCategory =
  | 'Invoice'
  | 'Client'
  | 'Project'
  | 'TimeEntry'
  | 'Timer'
  | 'Expense'
  | 'ExpenseCategory'
  | 'Payment'
  | 'Item'
  | 'Bill'
  | 'BillPayment'
  | 'BillVendor'
  | 'CreditNote'
  | 'OtherIncome'
  | 'JournalEntry'
  | 'JournalEntryAccount'
  | 'Service'
  | 'Task'
  | 'User'
  | 'Report'
  | 'PaymentOptions'
  | 'Callback';

/**
 * Metadata for a single tool
 */
export interface ToolMetadata {
  /** Tool name (e.g., 'invoice_list') */
  name: string;
  /** Category the tool belongs to */
  category: ToolCategory;
  /** Whether this tool only reads data (no mutations) */
  isReadOnly: boolean;
  /** Human-readable display name for the tool */
  displayName: string;
  /** Authorization tier required to execute this tool */
  tier: ToolTier;
  /** Whether this tool requires explicit confirmation before execution */
  requiresConfirmation: boolean;
  /** Confirmation message to display (if requiresConfirmation is true) */
  confirmationMessage?: string;
}

/**
 * Category metadata for UI display
 */
export interface CategoryMetadata {
  /** Category identifier */
  id: ToolCategory;
  /** Human-readable display name */
  displayName: string;
  /** Brief description of what this category covers */
  description: string;
  /** Number of read-only tools in this category */
  readOnlyCount: number;
  /** Number of write tools in this category */
  writeCount: number;
  /** All tools in this category */
  tools: ToolMetadata[];
}

/**
 * Display names for each category
 */
export const categoryDisplayNames: Record<ToolCategory, string> = {
  Invoice: 'Invoices',
  Client: 'Clients',
  Project: 'Projects',
  TimeEntry: 'Time Entries',
  Timer: 'Timers',
  Expense: 'Expenses',
  ExpenseCategory: 'Expense Categories',
  Payment: 'Payments',
  Item: 'Items',
  Bill: 'Bills',
  BillPayment: 'Bill Payments',
  BillVendor: 'Vendors',
  CreditNote: 'Credit Notes',
  OtherIncome: 'Other Income',
  JournalEntry: 'Journal Entries',
  JournalEntryAccount: 'Chart of Accounts',
  Service: 'Services',
  Task: 'Tasks',
  User: 'User Info',
  Report: 'Reports',
  PaymentOptions: 'Payment Options',
  Callback: 'Webhooks',
};

/**
 * Descriptions for each category
 */
export const categoryDescriptions: Record<ToolCategory, string> = {
  Invoice: 'Create, send, and manage client invoices',
  Client: 'Manage customers and their contact information',
  Project: 'Track projects and their details',
  TimeEntry: 'Log and manage time entries for billing',
  Timer: 'Start, stop, and manage active timers',
  Expense: 'Track business expenses and receipts',
  ExpenseCategory: 'View expense category definitions',
  Payment: 'Record and track invoice payments',
  Item: 'Manage reusable invoice line items',
  Bill: 'Track bills from vendors and suppliers',
  BillPayment: 'Record payments made to vendors',
  BillVendor: 'Manage vendors and suppliers',
  CreditNote: 'Create and manage credit notes',
  OtherIncome: 'Track income not tied to invoices',
  JournalEntry: 'Create manual accounting entries',
  JournalEntryAccount: 'View chart of accounts',
  Service: 'Manage billable services and rates',
  Task: 'Manage project tasks',
  User: 'View current user information',
  Report: 'Generate financial reports',
  PaymentOptions: 'Configure payment gateway settings',
  Callback: 'Manage webhook subscriptions',
};
