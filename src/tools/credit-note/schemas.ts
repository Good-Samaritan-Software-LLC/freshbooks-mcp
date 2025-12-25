/**
 * Zod schemas for CreditNote entity
 *
 * Credit note schemas for FreshBooks API
 */

import { z } from 'zod';
import { MoneySchema, PaginationMetadataSchema, VisStateSchema } from '../base-tool.js';

/**
 * Credit note status enum
 */
export const CreditNoteStatusEnum = z.enum([
  'created',
  'sent',
  'applied',
  'void',
]);

/**
 * Credit note line item schema
 */
export const CreditNoteLineSchema = z.object({
  name: z.string().describe('Line item description'),
  description: z.string().optional().describe('Detailed description'),
  taxName1: z.string().nullable().optional().describe('First tax name'),
  taxAmount1: z.string().nullable().optional().describe('First tax amount'),
  taxName2: z.string().nullable().optional().describe('Second tax name'),
  taxAmount2: z.string().nullable().optional().describe('Second tax amount'),
  quantity: z.number().optional().describe('Quantity'),
  unitCost: MoneySchema.optional().describe('Unit cost'),
  amount: MoneySchema.describe('Line total amount'),
});

/**
 * Full CreditNote schema with all properties
 */
export const CreditNoteSchema = z.object({
  id: z.number().describe('Unique credit note identifier'),
  creditNoteNumber: z.string().describe('Credit note number'),
  clientId: z.number().describe('Client receiving credit'),
  createDate: z.string().datetime().describe('Creation date (ISO 8601)'),
  amount: MoneySchema.describe('Total credit amount'),
  currencyCode: z.string().describe('Currency code (e.g., USD)'),
  status: CreditNoteStatusEnum.describe('Credit note status'),
  lines: z.array(CreditNoteLineSchema).optional().describe('Credit note line items'),
  notes: z.string().nullable().optional().describe('Internal notes'),
  terms: z.string().nullable().optional().describe('Terms and conditions'),
  language: z.string().optional().describe('Language code'),
  displayStatus: z.string().optional().describe('Display-friendly status'),
  disputeStatus: z.string().nullable().optional().describe('Dispute status'),
  organization: z.string().optional().describe('Client organization'),
  fName: z.string().optional().describe('Client first name'),
  lName: z.string().optional().describe('Client last name'),
  email: z.string().optional().describe('Client email'),
  address: z.string().optional().describe('Client address'),
  city: z.string().optional().describe('Client city'),
  province: z.string().optional().describe('Client province/state'),
  code: z.string().optional().describe('Client postal code'),
  country: z.string().optional().describe('Client country'),
  visState: VisStateSchema.optional().describe('Visibility state (0=active, 1=deleted)'),
  createdAt: z.string().datetime().optional().describe('Creation timestamp (ISO 8601)'),
  updated: z.string().datetime().optional().describe('Last update timestamp (ISO 8601)'),
});

/**
 * Input schema for creating a credit note
 */
export const CreditNoteCreateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  clientId: z.number().describe('Client to credit (required)'),
  createDate: z.string().datetime().describe('Credit note date (ISO 8601)'),
  currencyCode: z.string().default('USD').optional().describe('Currency code (e.g., USD)'),
  lines: z.array(z.object({
    name: z.string().describe('Line item description'),
    description: z.string().optional().describe('Detailed description'),
    quantity: z.number().default(1).optional().describe('Quantity'),
    unitCost: z.object({
      amount: z.string().describe('Unit cost amount'),
      code: z.string().describe('Currency code'),
    }).optional().describe('Unit cost'),
    amount: z.object({
      amount: z.string().describe('Line total amount'),
      code: z.string().describe('Currency code'),
    }).describe('Line total'),
  })).min(1).describe('Credit note line items (at least one required)'),
  notes: z.string().optional().describe('Internal notes'),
  terms: z.string().optional().describe('Terms and conditions'),
  language: z.string().optional().describe('Language code (e.g., en)'),
});

/**
 * Input schema for updating a credit note
 */
export const CreditNoteUpdateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  creditNoteId: z.number().describe('Credit note ID to update'),
  createDate: z.string().datetime().optional().describe('Credit note date (ISO 8601)'),
  lines: z.array(z.object({
    name: z.string().describe('Line item description'),
    description: z.string().optional().describe('Detailed description'),
    quantity: z.number().optional().describe('Quantity'),
    unitCost: z.object({
      amount: z.string().describe('Unit cost amount'),
      code: z.string().describe('Currency code'),
    }).optional().describe('Unit cost'),
    amount: z.object({
      amount: z.string().describe('Line total amount'),
      code: z.string().describe('Currency code'),
    }).describe('Line total'),
  })).optional().describe('Updated credit note line items'),
  notes: z.string().optional().describe('Internal notes'),
  terms: z.string().optional().describe('Terms and conditions'),
});

/**
 * Input schema for listing credit notes
 */
export const CreditNoteListInputSchema = z.object({
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
  clientId: z.number().optional().describe('Filter by client ID'),
  status: CreditNoteStatusEnum.optional().describe('Filter by status'),
  dateFrom: z.string().datetime().optional().describe('Filter credit notes after date (ISO 8601)'),
  dateTo: z.string().datetime().optional().describe('Filter credit notes before date (ISO 8601)'),
});

/**
 * Input schema for getting a single credit note
 */
export const CreditNoteSingleInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  creditNoteId: z.number().describe('Credit note ID to retrieve'),
});

/**
 * Input schema for deleting a credit note
 */
export const CreditNoteDeleteInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  creditNoteId: z.number().describe('Credit note ID to delete'),
});

/**
 * Output schema for credit note list
 */
export const CreditNoteListOutputSchema = z.object({
  creditNotes: z.array(CreditNoteSchema).describe('Array of credit notes'),
  pagination: PaginationMetadataSchema.describe('Pagination information'),
});

/**
 * Output schema for single credit note operations
 */
export const CreditNoteSingleOutputSchema = CreditNoteSchema;

/**
 * Output schema for credit note deletion
 */
export const CreditNoteDeleteOutputSchema = z.object({
  success: z.boolean().describe('Whether deletion was successful'),
  creditNoteId: z.number().describe('ID of deleted credit note'),
});
