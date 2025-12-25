/**
 * Zod schemas for JournalEntryAccount entity
 *
 * Chart of accounts schemas for FreshBooks API
 */

import { z } from 'zod';

/**
 * Sub-account schema (individual account in the chart)
 */
export const SubAccountSchema = z.object({
  id: z.number().describe('Sub-account ID'),
  accountId: z.number().describe('Parent account ID'),
  name: z.string().describe('Account name'),
  accountNumber: z.string().optional().describe('Account number (e.g., "1000")'),
  description: z.string().optional().describe('Account description'),
  accountType: z.string().describe('Account type (e.g., "asset", "liability", "equity", "revenue", "expense")'),
  balance: z.object({
    amount: z.string().describe('Current balance amount'),
    code: z.string().describe('Currency code'),
  }).optional().describe('Current account balance'),
  customName: z.string().optional().describe('Custom account name'),
  subName: z.string().optional().describe('Sub-account name'),
});

/**
 * Full JournalEntryAccount (chart of accounts) schema
 */
export const JournalEntryAccountSchema = z.object({
  id: z.number().describe('Account ID'),
  accountType: z.string().describe('Account type category'),
  name: z.string().describe('Account name'),
  subAccounts: z.array(SubAccountSchema).describe('Sub-accounts under this account'),
});

/**
 * Input schema for listing journal entry accounts
 */
export const JournalEntryAccountListInputSchema = z.object({
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
  accountType: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']).optional().describe('Filter by account type'),
});

/**
 * Pagination metadata schema
 */
export const PaginationMetadataSchema = z.object({
  page: z.number().describe('Current page number'),
  pages: z.number().describe('Total number of pages'),
  perPage: z.number().describe('Results per page'),
  total: z.number().describe('Total number of results'),
});

/**
 * Output schema for journal entry account list
 */
export const JournalEntryAccountListOutputSchema = z.object({
  accounts: z.array(JournalEntryAccountSchema).describe('Array of chart of accounts'),
  pagination: PaginationMetadataSchema.describe('Pagination information'),
});
