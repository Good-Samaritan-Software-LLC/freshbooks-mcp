/**
 * Zod schemas for JournalEntry entity
 *
 * Accounting journal entry schemas for FreshBooks API
 */

import { z } from 'zod';

/**
 * Journal entry detail line schema (response shape).
 *
 * `description` appears here because the API RETURNS it on each line — but it
 * is the entry-level memo stamped onto every detail (live-verified 2026-06-07),
 * not an independently-settable per-line value. See JournalEntryDetailInputSchema.
 */
export const JournalEntryDetailSchema = z.object({
  subAccountId: z.number().describe('Sub-account ID from chart of accounts'),
  debit: z.string().optional().describe('Debit amount (decimal string, e.g., "100.00")'),
  credit: z.string().optional().describe('Credit amount (decimal string, e.g., "100.00")'),
  description: z.string().optional().describe('Line description (the entry-level memo, stamped by the API onto every line)'),
});

/**
 * Journal entry detail line schema (create input shape).
 *
 * No `description`: the FreshBooks accounting API has no independent per-line
 * memo — it stamps the entry-level `description` onto every line, so a per-line
 * value is silently ignored (live-verified 2026-06-07, audit finding 6b). Use
 * the top-level `description` on JournalEntryCreateInputSchema instead.
 */
export const JournalEntryDetailInputSchema = z.object({
  subAccountId: z.number().describe('Sub-account ID from chart of accounts'),
  debit: z.string().optional().describe('Debit amount (decimal string, e.g., "100.00")'),
  credit: z.string().optional().describe('Credit amount (decimal string, e.g., "100.00")'),
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
  description: z.string().optional().describe('Entry memo/description. The API stamps this onto every detail line (there is no separate per-line memo)'),
  currencyCode: z.string().default('USD').optional().describe('Currency code (defaults to USD)'),
  details: z.array(JournalEntryDetailInputSchema).min(2).describe('Array of debit/credit lines (minimum 2, must balance)'),
});

/**
 * Output schema for journal entry creation
 */
export const JournalEntryCreateOutputSchema = JournalEntrySchema;
