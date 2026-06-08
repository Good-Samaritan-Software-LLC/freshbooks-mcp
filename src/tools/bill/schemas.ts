/**
 * Zod schemas for Bill entity
 *
 * Bill management schemas for FreshBooks API
 */

import { z } from 'zod';
import { MoneySchema, VisStateSchema } from '../base-tool.js';

/**
 * Bill status enum
 */
export const BillStatusEnum = z.enum(['unpaid', 'partial', 'paid', 'overdue']);

/**
 * Full Bill schema with all properties
 */
export const BillSchema = z.object({
  id: z.number().describe('Unique bill identifier'),
  billNumber: z.string().nullable().describe('Bill number'),
  vendorId: z.number().describe('Vendor ID'),
  amount: MoneySchema.describe('Bill total amount'),
  outstandingAmount: MoneySchema.nullable().describe('Outstanding amount'),
  paidAmount: MoneySchema.nullable().describe('Amount paid'),
  dueDate: z.string().datetime().nullable().describe('Payment due date (ISO 8601)'),
  issueDate: z.string().datetime().describe('Bill issue date (ISO 8601)'),
  status: BillStatusEnum.describe('Bill status'),
  lines: z.array(z.any()).describe('Bill line items'),
  // The bill has no writable notes field; `overall_description` is READ-ONLY
  // (errno 1038 on write) and auto-derived from the line description(s)
  // (live-verified 2026-06-07, audit finding 8).
  overallDescription: z.string().nullable().optional().describe('Read-only summary description, derived by FreshBooks from the line items'),
  attachment: z.any().nullable().describe('Attached document/receipt'),
  taxAmount: MoneySchema.nullable().describe('Total tax amount'),
  createdAt: z.string().datetime().describe('Creation timestamp (ISO 8601)'),
  updatedAt: z.string().datetime().describe('Last update timestamp (ISO 8601)'),
  visState: VisStateSchema.optional().describe('Visibility state'),
});

/**
 * Input schema for creating a bill
 */
export const BillCreateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  vendorId: z.number().describe('Vendor ID (required)'),
  issueDate: z.string().describe('Bill issue date (YYYY-MM-DD)'),
  dueDate: z.string().optional().describe('Payment due date (YYYY-MM-DD). If given, the due offset is derived from it.'),
  dueOffsetDays: z.number().int().min(0).optional().describe('Days after the issue date the bill is due (the API requires this; derived from dueDate when omitted, else 0)'),
  currencyCode: z.string().optional().describe('Currency code (required by the API; defaults to USD)'),
  language: z.string().optional().describe('Language code (defaults to en)'),
  billNumber: z.string().optional().describe('Bill number'),
  // NOTE: the bill total is COMPUTED by FreshBooks from `lines`; the API rejects
  // a written `amount` (live-confirmed 403, and the SDK omits it on create), so
  // it is intentionally not part of the create input (report H6).
  lines: z.array(z.any()).optional().describe('Bill line items (use the line `description` for descriptive text — the bill summary is derived from it)'),
  // No `notes`: the bills API has no writable notes field (live-verified
  // 2026-06-07 — a sent `notes` does not persist, and `overall_description` is
  // read-only and auto-derived from the lines). audit finding 8.
  attachment: z.any().optional().describe('Attached document/receipt'),
});

/**
 * Input schema for listing bills
 */
export const BillListInputSchema = z.object({
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
  vendorId: z.number().optional().describe('Filter by vendor ID'),
  status: BillStatusEnum.optional().describe('Filter by bill status'),
  startDate: z.string().optional().describe('Filter bills after this date (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('Filter bills before this date (YYYY-MM-DD)'),
});

/**
 * Input schema for getting a single bill
 */
export const BillSingleInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  billId: z.number().describe('Bill ID to retrieve'),
});

/**
 * Input schema for deleting a bill
 */
export const BillDeleteInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  billId: z.number().describe('Bill ID to delete'),
  confirmed: z.boolean().optional().describe('Set to true to confirm deletion of this bill'),
  confirmationId: z.string().optional().describe('Confirmation token from the initial delete request (required with confirmed: true)'),
});

/**
 * Input schema for archiving a bill
 */
export const BillArchiveInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  billId: z.number().describe('Bill ID to archive'),
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
 * Output schema for bill list
 */
export const BillListOutputSchema = z.object({
  bills: z.array(BillSchema).describe('Array of bills'),
  pagination: PaginationMetadataSchema.describe('Pagination information'),
});

/**
 * Output schema for single bill operations
 */
export const BillSingleOutputSchema = BillSchema;

/**
 * Output schema for bill deletion
 */
export const BillDeleteOutputSchema = z.object({
  success: z.boolean().describe('Whether deletion was successful'),
  billId: z.number().describe('ID of deleted bill'),
});

/**
 * Output schema for bill archiving
 */
export const BillArchiveOutputSchema = z.object({
  success: z.boolean().describe('Whether archiving was successful'),
  billId: z.number().describe('ID of archived bill'),
});
