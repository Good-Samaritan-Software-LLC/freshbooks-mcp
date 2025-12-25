/**
 * Zod schemas for JournalEntry entity
 *
 * Accounting journal entry schemas for FreshBooks API
 */

import { z } from 'zod';

/**
 * Journal entry detail line schema
 */
export const JournalEntryDetailSchema = z.object({
  subAccountId: z.number().describe('Sub-account ID from chart of accounts'),
  debit: z.string().optional().describe('Debit amount (decimal string, e.g., "100.00")'),
  credit: z.string().optional().describe('Credit amount (decimal string, e.g., "100.00")'),
  description: z.string().optional().describe('Line description'),
});

/**
 * Full JournalEntry schema with all properties
 */
export const JournalEntrySchema = z.object({
  id: z.number().optional().describe('Unique journal entry identifier'),
  name: z.string().describe('Journal entry name/description'),
  description: z.string().optional().describe('Detailed description'),
  date: z.string().describe('Entry date (YYYY-MM-DD format)'),
  details: z.array(JournalEntryDetailSchema).describe('Debit and credit lines'),
  currencyCode: z.string().optional().describe('Currency code (e.g., USD)'),
  createdAt: z.string().datetime().optional().describe('Creation timestamp (ISO 8601)'),
});

/**
 * Input schema for creating a journal entry
 */
export const JournalEntryCreateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  name: z.string().min(1).describe('Journal entry name/description (required)'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Entry date in YYYY-MM-DD format'),
  description: z.string().optional().describe('Detailed description of the adjustment'),
  currencyCode: z.string().default('USD').optional().describe('Currency code (defaults to USD)'),
  details: z.array(JournalEntryDetailSchema).min(2).describe('Array of debit/credit lines (minimum 2, must balance)'),
});

/**
 * Output schema for journal entry creation
 */
export const JournalEntryCreateOutputSchema = JournalEntrySchema;
