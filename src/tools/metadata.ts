/**
 * Tool Metadata Registry
 *
 * Provides metadata for all tools including category classification
 * and read-only status. This is used by the hosted server to
 * filter tools based on user permissions.
 */

import {
  ToolCategory,
  ToolMetadata,
  CategoryMetadata,
  categoryDisplayNames,
  categoryDescriptions,
} from './types.js';

// Import all tools to build the registry
import {
  timeentryListTool,
  timeentrySingleTool,
  timeentryCreateTool,
  timeentryUpdateTool,
  timeentryDeleteTool,
} from './time-entry/index.js';

import {
  timerStartTool,
  timerStopTool,
  timerCurrentTool,
  timerDiscardTool,
} from './timer/index.js';

import {
  projectListTool,
  projectSingleTool,
  projectCreateTool,
  projectUpdateTool,
  projectDeleteTool,
} from './project/index.js';

import {
  serviceListTool,
  serviceSingleTool,
  serviceCreateTool,
  serviceRateGetTool,
  serviceRateSetTool,
} from './service/index.js';

import {
  taskListTool,
  taskSingleTool,
  taskCreateTool,
  taskUpdateTool,
  taskDeleteTool,
} from './task/index.js';

import {
  clientListTool,
  clientSingleTool,
  clientCreateTool,
  clientUpdateTool,
  clientDeleteTool,
} from './client/index.js';

import {
  invoiceListTool,
  invoiceSingleTool,
  invoiceCreateTool,
  invoiceUpdateTool,
  invoiceDeleteTool,
  invoiceShareLinkTool,
} from './invoice/index.js';

import {
  paymentListTool,
  paymentSingleTool,
  paymentCreateTool,
  paymentUpdateTool,
  paymentDeleteTool,
} from './payment/index.js';

import {
  expenseListTool,
  expenseSingleTool,
  expenseCreateTool,
  expenseUpdateTool,
  expenseDeleteTool,
} from './expense/index.js';

import {
  expensecategoryListTool,
  expensecategorySingleTool,
} from './expense-category/index.js';

import {
  itemListTool,
  itemSingleTool,
  itemCreateTool,
  itemUpdateTool,
} from './item/index.js';

import {
  billListTool,
  billSingleTool,
  billCreateTool,
  billDeleteTool,
  billArchiveTool,
} from './bill/index.js';

import {
  billpaymentListTool,
  billpaymentSingleTool,
  billpaymentCreateTool,
  billpaymentUpdateTool,
  billpaymentDeleteTool,
} from './bill-payment/index.js';

import {
  billvendorListTool,
  billvendorSingleTool,
  billvendorCreateTool,
  billvendorUpdateTool,
  billvendorDeleteTool,
} from './bill-vendor/index.js';

import {
  creditnoteListTool,
  creditnoteSingleTool,
  creditnoteCreateTool,
  creditnoteUpdateTool,
  creditnoteDeleteTool,
} from './credit-note/index.js';

import {
  otherincomeListTool,
  otherincomeSingleTool,
  otherincomeCreateTool,
  otherincomeUpdateTool,
  otherincomeDeleteTool,
} from './other-income/index.js';

import { journalEntryCreateTool } from './journal-entry/index.js';

import { journalEntryAccountListTool } from './journal-entry-account/index.js';

import { userMeTool } from './user/index.js';

import {
  paymentsCollectedReportTool,
  profitLossReportTool,
  taxSummaryReportTool,
} from './report/index.js';

import {
  paymentOptionsSingleTool,
  paymentOptionsCreateTool,
  paymentOptionsDefaultTool,
} from './payment-options/index.js';

import {
  callbackListTool,
  callbackSingleTool,
  callbackCreateTool,
  callbackUpdateTool,
  callbackDeleteTool,
  callbackVerifyTool,
  callbackResendVerificationTool,
} from './callback/index.js';

/**
 * Mapping from tool name prefix to category
 */
const prefixToCategory: Record<string, ToolCategory> = {
  timeentry: 'TimeEntry',
  timer: 'Timer',
  project: 'Project',
  service: 'Service',
  task: 'Task',
  client: 'Client',
  invoice: 'Invoice',
  payment: 'Payment',
  expense: 'Expense',
  expensecategory: 'ExpenseCategory',
  item: 'Item',
  bill: 'Bill',
  billpayment: 'BillPayment',
  billvendor: 'BillVendor',
  creditnote: 'CreditNote',
  otherincome: 'OtherIncome',
  journalentry: 'JournalEntry',
  journalentryaccount: 'JournalEntryAccount',
  user: 'User',
  report: 'Report',
  paymentoptions: 'PaymentOptions',
  callback: 'Callback',
};

/**
 * Tool name suffixes that indicate read-only operations
 */
const readOnlySuffixes = ['_list', '_single', '_me', '_default', '_current'];

/**
 * Tool name patterns that indicate read-only operations
 */
const readOnlyPatterns = [/^report_/, /_get$/];

/**
 * Determine if a tool is read-only based on its name
 */
function isReadOnlyTool(toolName: string): boolean {
  // Check suffixes
  for (const suffix of readOnlySuffixes) {
    if (toolName.endsWith(suffix)) {
      return true;
    }
  }

  // Check patterns
  for (const pattern of readOnlyPatterns) {
    if (pattern.test(toolName)) {
      return true;
    }
  }

  return false;
}

/**
 * Determine the category of a tool based on its name
 */
function getToolCategory(toolName: string): ToolCategory {
  // Extract prefix (everything before the operation suffix)
  const parts = toolName.split('_');

  // Try different prefix lengths to find a match
  for (let i = parts.length - 1; i >= 1; i--) {
    const prefix = parts.slice(0, i).join('');
    const category = prefixToCategory[prefix];
    if (category !== undefined) {
      return category;
    }
  }

  // Fallback - shouldn't happen with properly named tools
  console.warn(`Unknown category for tool: ${toolName}`);
  return 'User';
}

/**
 * Create a human-readable display name from tool name
 */
function getDisplayName(toolName: string): string {
  return toolName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Build metadata for a single tool
 */
function buildToolMetadata(tool: { name: string }): ToolMetadata {
  return {
    name: tool.name,
    category: getToolCategory(tool.name),
    isReadOnly: isReadOnlyTool(tool.name),
    displayName: getDisplayName(tool.name),
  };
}

/**
 * All tools in the package
 */
const allTools = [
  // TimeEntry
  timeentryListTool,
  timeentrySingleTool,
  timeentryCreateTool,
  timeentryUpdateTool,
  timeentryDeleteTool,
  // Timer
  timerStartTool,
  timerStopTool,
  timerCurrentTool,
  timerDiscardTool,
  // Project
  projectListTool,
  projectSingleTool,
  projectCreateTool,
  projectUpdateTool,
  projectDeleteTool,
  // Service
  serviceListTool,
  serviceSingleTool,
  serviceCreateTool,
  serviceRateGetTool,
  serviceRateSetTool,
  // Task
  taskListTool,
  taskSingleTool,
  taskCreateTool,
  taskUpdateTool,
  taskDeleteTool,
  // Client
  clientListTool,
  clientSingleTool,
  clientCreateTool,
  clientUpdateTool,
  clientDeleteTool,
  // Invoice
  invoiceListTool,
  invoiceSingleTool,
  invoiceCreateTool,
  invoiceUpdateTool,
  invoiceDeleteTool,
  invoiceShareLinkTool,
  // Payment
  paymentListTool,
  paymentSingleTool,
  paymentCreateTool,
  paymentUpdateTool,
  paymentDeleteTool,
  // Expense
  expenseListTool,
  expenseSingleTool,
  expenseCreateTool,
  expenseUpdateTool,
  expenseDeleteTool,
  // ExpenseCategory
  expensecategoryListTool,
  expensecategorySingleTool,
  // Item
  itemListTool,
  itemSingleTool,
  itemCreateTool,
  itemUpdateTool,
  // Bill
  billListTool,
  billSingleTool,
  billCreateTool,
  billDeleteTool,
  billArchiveTool,
  // BillPayment
  billpaymentListTool,
  billpaymentSingleTool,
  billpaymentCreateTool,
  billpaymentUpdateTool,
  billpaymentDeleteTool,
  // BillVendor
  billvendorListTool,
  billvendorSingleTool,
  billvendorCreateTool,
  billvendorUpdateTool,
  billvendorDeleteTool,
  // CreditNote
  creditnoteListTool,
  creditnoteSingleTool,
  creditnoteCreateTool,
  creditnoteUpdateTool,
  creditnoteDeleteTool,
  // OtherIncome
  otherincomeListTool,
  otherincomeSingleTool,
  otherincomeCreateTool,
  otherincomeUpdateTool,
  otherincomeDeleteTool,
  // JournalEntry
  journalEntryCreateTool,
  // JournalEntryAccount
  journalEntryAccountListTool,
  // User
  userMeTool,
  // Report
  paymentsCollectedReportTool,
  profitLossReportTool,
  taxSummaryReportTool,
  // PaymentOptions
  paymentOptionsSingleTool,
  paymentOptionsCreateTool,
  paymentOptionsDefaultTool,
  // Callback
  callbackListTool,
  callbackSingleTool,
  callbackCreateTool,
  callbackUpdateTool,
  callbackDeleteTool,
  callbackVerifyTool,
  callbackResendVerificationTool,
];

/**
 * Registry mapping tool names to their metadata
 */
export const toolMetadataRegistry: Map<string, ToolMetadata> = new Map(
  allTools.map((tool) => [tool.name, buildToolMetadata(tool)])
);

/**
 * Get metadata for a specific tool
 */
export function getToolMetadata(toolName: string): ToolMetadata | undefined {
  return toolMetadataRegistry.get(toolName);
}

/**
 * Check if a tool is read-only
 */
export function isToolReadOnly(toolName: string): boolean {
  const metadata = toolMetadataRegistry.get(toolName);
  return metadata?.isReadOnly ?? false;
}

/**
 * Get all tools in a specific category
 */
export function getToolsByCategory(category: ToolCategory): ToolMetadata[] {
  return Array.from(toolMetadataRegistry.values()).filter(
    (tool) => tool.category === category
  );
}

/**
 * Build category metadata with tool counts
 */
function buildCategoryMetadata(category: ToolCategory): CategoryMetadata {
  const tools = getToolsByCategory(category);
  const readOnlyTools = tools.filter((t) => t.isReadOnly);
  const writeTools = tools.filter((t) => !t.isReadOnly);

  return {
    id: category,
    displayName: categoryDisplayNames[category],
    description: categoryDescriptions[category],
    readOnlyCount: readOnlyTools.length,
    writeCount: writeTools.length,
    tools,
  };
}

/**
 * All categories with their metadata
 */
export const allCategories: CategoryMetadata[] = (
  Object.keys(categoryDisplayNames) as ToolCategory[]
).map(buildCategoryMetadata);

/**
 * Map of category ID to category metadata
 */
export const categoryMetadataMap: Map<ToolCategory, CategoryMetadata> = new Map(
  allCategories.map((cat) => [cat.id, cat])
);

/**
 * Get a summary of tool counts
 */
export function getToolCounts(): {
  total: number;
  readOnly: number;
  write: number;
} {
  const all = Array.from(toolMetadataRegistry.values());
  const readOnly = all.filter((t) => t.isReadOnly).length;
  return {
    total: all.length,
    readOnly,
    write: all.length - readOnly,
  };
}

/**
 * Get all read-only tool names
 */
export function getReadOnlyToolNames(): string[] {
  return Array.from(toolMetadataRegistry.values())
    .filter((t) => t.isReadOnly)
    .map((t) => t.name);
}

/**
 * Get all write tool names
 */
export function getWriteToolNames(): string[] {
  return Array.from(toolMetadataRegistry.values())
    .filter((t) => !t.isReadOnly)
    .map((t) => t.name);
}
