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
  notes: z.string().nullable().describe('Bill notes'),
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
  issueDate: z.string().datetime().describe('Bill issue date (ISO 8601)'),
  dueDate: z.string().datetime().optional().describe('Payment due date (ISO 8601)'),
  billNumber: z.string().optional().describe('Bill number'),
  amount: z.object({
    amount: z.string().describe('Bill amount'),
    code: z.string().describe('Currency code (e.g., USD)'),
  }).describe('Bill total amount'),
  lines: z.array(z.any()).optional().describe('Bill line items'),
  notes: z.string().optional().describe('Bill notes'),
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
  startDate: z.string().datetime().optional().describe('Filter bills after this date'),
  endDate: z.string().datetime().optional().describe('Filter bills before this date'),
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
