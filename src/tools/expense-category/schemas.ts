/**
 * Zod schemas for ExpenseCategory entity
 *
 * Expense category schemas for FreshBooks API (read-only)
 */

import { z } from 'zod';
import { VisStateSchema, PaginationMetadataSchema } from '../base-tool.js';

/**
 * Full ExpenseCategory schema
 *
 * Note: ExpenseCategory is a read-only resource with predefined categories from FreshBooks.
 * The exact schema may vary, but typically includes id, category name, and visibility state.
 */
export const ExpenseCategorySchema = z.object({
  id: z.number().describe('Unique category identifier'),
  categoryid: z.number().optional().describe('Category ID (alternate field)'),
  category: z.string().describe('Category name (e.g., "Travel", "Meals", "Office Supplies")'),
  visState: VisStateSchema.optional().describe('Visibility state (0=active, 1=deleted, 2=archived)'),
  updated: z.string().datetime().optional().describe('Last update timestamp (ISO 8601)'),
  // Additional fields that might be present
  is_cogs: z.boolean().optional().describe('Whether category is Cost of Goods Sold'),
  is_editable: z.boolean().optional().describe('Whether category can be edited'),
  parentid: z.number().nullable().optional().describe('Parent category ID if subcategory'),
});

/**
 * Input schema for listing expense categories
 */
export const ExpenseCategoryListInputSchema = z.object({
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
});

/**
 * Input schema for getting a single expense category
 */
export const ExpenseCategorySingleInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  categoryId: z.number().int().positive().describe('Category ID to retrieve'),
});

/**
 * Output schema for expense category list
 */
export const ExpenseCategoryListOutputSchema = z.object({
  categories: z.array(ExpenseCategorySchema).describe('Array of expense categories'),
  pagination: PaginationMetadataSchema.describe('Pagination information'),
});

/**
 * Output schema for single expense category
 */
export const ExpenseCategorySingleOutputSchema = ExpenseCategorySchema;
