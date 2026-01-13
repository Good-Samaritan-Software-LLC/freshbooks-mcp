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
 * NOTE: Field names and types match the FreshBooks SDK CreditNote model
 */
export const CreditNoteSchema = z.object({
  id: z.number().optional().describe('Unique credit note identifier'),
  creditId: z.number().optional().describe('Alternate credit note identifier'),
  creditNumber: z.string().optional().describe('Credit note number'),
  // Legacy field name - some API responses may use this
  creditNoteNumber: z.string().optional().describe('Credit note number (alternate)'),
  clientId: z.union([z.string(), z.number()]).optional().describe('Client receiving credit'),
  createDate: z.any().optional().describe('Creation date'),
  amount: MoneySchema.optional().describe('Total credit amount'),
  currencyCode: z.string().optional().describe('Currency code (e.g., USD)'),
  status: CreditNoteStatusEnum.optional().describe('Credit note status'),
  lines: z.array(CreditNoteLineSchema).optional().describe('Credit note line items'),
  notes: z.string().nullable().optional().describe('Internal notes'),
  terms: z.string().nullable().optional().describe('Terms and conditions'),
  language: z.string().optional().describe('Language code'),
  displayStatus: z.string().optional().describe('Display-friendly status'),
  disputeStatus: z.string().nullable().optional().describe('Dispute status'),
  organization: z.string().optional().describe('Client organization'),
  currentOrganization: z.string().optional().describe('Current organization name'),
  fName: z.string().optional().describe('Client first name'),
  lName: z.string().optional().describe('Client last name'),
  email: z.string().optional().describe('Client email'),
  street: z.string().optional().describe('Client street address'),
  street2: z.string().optional().describe('Client street address line 2'),
  city: z.string().optional().describe('Client city'),
  province: z.string().optional().describe('Client province/state'),
  code: z.string().optional().describe('Client postal code'),
  country: z.string().optional().describe('Client country'),
  visState: VisStateSchema.optional().describe('Visibility state (0=active, 1=deleted)'),
  paid: MoneySchema.optional().describe('Amount already applied'),
  paymentStatus: z.string().optional().describe('Payment status'),
  description: z.string().optional().describe('Credit note description'),
  accountingSystemId: z.string().optional().describe('Accounting system ID'),
}).passthrough();

/**
 * Input schema for creating a credit note
 */
export const CreditNoteCreateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  clientId: z.number().describe('Client to credit (required)'),
  // Accept both "YYYY-MM-DD" and full ISO datetime formats
  createDate: z.string().describe('Credit note date (YYYY-MM-DD or ISO 8601)').transform((val) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      return `${val}T00:00:00Z`;
    }
    return val;
  }),
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
  // Accept both "YYYY-MM-DD" and full ISO datetime formats
  createDate: z.string().optional().describe('Credit note date (YYYY-MM-DD or ISO 8601)').transform((val) => {
    if (!val) return val;
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      return `${val}T00:00:00Z`;
    }
    return val;
  }),
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
  dateFrom: z.string().optional().describe('Filter credit notes after date (YYYY-MM-DD or ISO 8601)').transform((val) => {
    if (!val) return val;
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      return `${val}T00:00:00Z`;
    }
    return val;
  }),
  dateTo: z.string().optional().describe('Filter credit notes before date (YYYY-MM-DD or ISO 8601)').transform((val) => {
    if (!val) return val;
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      return `${val}T23:59:59Z`;
    }
    return val;
  }),
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
  confirmed: z.boolean().optional().describe('Set to true to confirm deletion of this credit note'),
  confirmationId: z.string().optional().describe('Confirmation token from the initial delete request (required with confirmed: true)'),
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
