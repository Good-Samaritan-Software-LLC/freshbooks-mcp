/**
 * Zod schemas for Expense entity
 *
 * Business expense tracking schemas for FreshBooks API
 */

import { z } from 'zod';
import { MoneySchema, VisStateSchema, PaginationMetadataSchema } from '../base-tool.js';

/**
 * Expense status enum
 */
export const ExpenseStatusEnum = z.enum([
  'outstanding',
  'invoiced',
  'partial',
  'paid',
]);

/**
 * Full Expense schema with all properties
 */
export const ExpenseSchema = z.object({
  id: z.number().describe('Unique expense identifier'),
  expenseId: z.number().optional().describe('Expense ID (alternate field)'),
  categoryId: z.number().describe('Expense category ID'),
  staffId: z.number().describe('Staff member who incurred expense'),
  date: z.string().datetime().describe('Expense date (ISO 8601)'),
  amount: MoneySchema.describe('Expense amount with currency'),
  vendor: z.string().nullable().describe('Vendor name'),
  notes: z.string().describe('Expense notes/description'),
  clientId: z.number().optional().describe('Client to bill for expense'),
  projectId: z.number().optional().describe('Associated project ID'),
  invoiceId: z.number().nullable().optional().describe('Invoice ID if expense has been billed'),
  status: ExpenseStatusEnum.optional().describe('Expense status'),
  hasReceipt: z.boolean().optional().describe('Whether a receipt is attached'),
  markupPercent: z.number().optional().describe('Markup percentage for billing'),
  taxName1: z.string().nullable().optional().describe('First tax name'),
  taxPercent1: z.string().nullable().optional().describe('First tax percentage'),
  taxAmount1: MoneySchema.nullable().optional().describe('First tax amount'),
  taxName2: z.string().nullable().optional().describe('Second tax name'),
  taxPercent2: z.string().nullable().optional().describe('Second tax percentage'),
  taxAmount2: MoneySchema.nullable().optional().describe('Second tax amount'),
  visState: VisStateSchema.optional().describe('Visibility state (0=active, 1=deleted, 2=archived)'),
  updated: z.string().datetime().optional().describe('Last update timestamp (ISO 8601)'),
});

/**
 * Input schema for creating an expense
 */
export const ExpenseCreateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  categoryId: z.number().int().positive().describe('Expense category ID (required)'),
  staffId: z.number().int().positive().describe('Staff member ID (required)'),
  date: z.string().describe('Expense date (YYYY-MM-DD)'),
  amount: z.object({
    amount: z.string().describe('Expense amount as decimal string'),
    code: z.string().describe('Currency code (e.g., USD)'),
  }).describe('Expense amount with currency'),
  vendor: z.string().optional().describe('Vendor name'),
  notes: z.string().optional().describe('Expense notes/description'),
  clientId: z.number().int().positive().optional().describe('Client to bill'),
  projectId: z.number().int().positive().optional().describe('Associated project'),
  markupPercent: z.number().min(0).max(100).optional().describe('Markup percentage (0-100)'),
  taxName1: z.string().optional().describe('First tax name'),
  taxPercent1: z.string().optional().describe('First tax percentage'),
  taxName2: z.string().optional().describe('Second tax name'),
  taxPercent2: z.string().optional().describe('Second tax percentage'),
});

/**
 * Input schema for updating an expense
 */
export const ExpenseUpdateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  expenseId: z.number().int().positive().describe('Expense ID to update'),
  categoryId: z.number().int().positive().optional().describe('Expense category ID'),
  date: z.string().optional().describe('Expense date (YYYY-MM-DD)'),
  amount: z.object({
    amount: z.string().describe('Expense amount as decimal string'),
    code: z.string().describe('Currency code (e.g., USD)'),
  }).optional().describe('Expense amount with currency'),
  vendor: z.string().optional().describe('Vendor name'),
  notes: z.string().optional().describe('Expense notes/description'),
  clientId: z.number().int().positive().optional().describe('Client to bill'),
  projectId: z.number().int().positive().optional().describe('Associated project'),
  markupPercent: z.number().min(0).max(100).optional().describe('Markup percentage (0-100)'),
  taxName1: z.string().optional().describe('First tax name'),
  taxPercent1: z.string().optional().describe('First tax percentage'),
  taxName2: z.string().optional().describe('Second tax name'),
  taxPercent2: z.string().optional().describe('Second tax percentage'),
  visState: VisStateSchema.optional().describe('Visibility state'),
});

/**
 * Input schema for listing expenses
 */
export const ExpenseListInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  page: z.number().int().min(1).default(1).optional().describe('Page number (1-indexed)'),
  perPage: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(30)
    .optional()
    .describe('Number of results per page (max 100)'),
  clientId: z.number().int().positive().optional().describe('Filter by client ID'),
  projectId: z.number().int().positive().optional().describe('Filter by project ID'),
  categoryId: z.number().int().positive().optional().describe('Filter by category ID'),
  status: ExpenseStatusEnum.optional().describe('Filter by expense status'),
  dateMin: z.string().optional().describe('Filter expenses on or after date (YYYY-MM-DD)'),
  dateMax: z.string().optional().describe('Filter expenses on or before date (YYYY-MM-DD)'),
});

/**
 * Input schema for getting a single expense
 */
export const ExpenseSingleInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  expenseId: z.number().int().positive().describe('Expense ID to retrieve'),
});

/**
 * Input schema for deleting an expense
 */
export const ExpenseDeleteInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  expenseId: z.number().int().positive().describe('Expense ID to delete'),
  confirmed: z.boolean().optional().describe('Set to true to confirm deletion of this expense'),
  confirmationId: z.string().optional().describe('Confirmation token from the initial delete request (required with confirmed: true)'),
});

/**
 * Output schema for expense list
 */
export const ExpenseListOutputSchema = z.object({
  expenses: z.array(ExpenseSchema).describe('Array of expenses'),
  pagination: PaginationMetadataSchema.describe('Pagination information'),
});

/**
 * Output schema for single expense operations
 */
export const ExpenseSingleOutputSchema = ExpenseSchema;

/**
 * Output schema for expense deletion
 */
export const ExpenseDeleteOutputSchema = z.object({
  success: z.boolean().describe('Whether deletion was successful'),
  expenseId: z.number().describe('ID of deleted expense'),
});
