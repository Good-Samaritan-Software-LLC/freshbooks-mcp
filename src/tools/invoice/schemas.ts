/**
 * Zod schemas for Invoice entity
 *
 * Invoice management schemas for FreshBooks API
 */

import { z } from 'zod';
import { createSortSchema, createIncludesSchema } from '../base-tool.js';

/**
 * Invoice sortable fields
 */
export const INVOICE_SORTABLE_FIELDS = [
  'create_date',
  'due_date',
  'updated',
  'amount',
  'outstanding',
] as const;

/**
 * Invoice sort field descriptions
 */
export const INVOICE_SORT_FIELD_DESCRIPTIONS: Record<typeof INVOICE_SORTABLE_FIELDS[number], string> = {
  create_date: 'Invoice creation date',
  due_date: 'Payment due date',
  updated: 'Last modification time',
  amount: 'Total invoice amount',
  outstanding: 'Remaining unpaid amount',
};

/**
 * Invoice include options
 */
export const INVOICE_INCLUDE_OPTIONS = [
  'lines',
  'presentation',
] as const;

/**
 * Invoice include option descriptions
 */
export const INVOICE_INCLUDE_DESCRIPTIONS: Record<typeof INVOICE_INCLUDE_OPTIONS[number], string> = {
  lines: 'Invoice line items with item details, quantities, and amounts',
  presentation: 'Invoice presentation/styling settings',
};

/**
 * Invoice sort schema
 */
export const InvoiceSortSchema = createSortSchema(
  INVOICE_SORTABLE_FIELDS,
  INVOICE_SORT_FIELD_DESCRIPTIONS
);

/**
 * Invoice includes schema
 */
export const InvoiceIncludesSchema = createIncludesSchema(
  INVOICE_INCLUDE_OPTIONS,
  INVOICE_INCLUDE_DESCRIPTIONS
);

/**
 * Invoice status enum
 */
export const InvoiceStatusEnum = z.enum([
  'draft',
  'sent',
  'viewed',
  'partial',
  'paid',
  'auto_paid',
  'retry',
  'failed',
  'overdue',
  'disputed',
]);

/**
 * Payment status enum
 */
export const PaymentStatusEnum = z.enum([
  'unpaid',
  'partial',
  'paid',
  'auto_paid',
]);

/**
 * Visibility state enum
 */
export const VisStateEnum = z.union([z.literal(0), z.literal(1), z.literal(2)]).describe(
  'Visibility state: 0=active, 1=deleted, 2=archived'
);

/**
 * Money type (amount + currency code)
 */
export const MoneySchema = z.object({
  amount: z.string().describe('Decimal amount as string'),
  code: z.string().describe('Currency code (e.g., USD)'),
});

/**
 * Line Item schema - represents a single line on an invoice
 */
export const LineItemSchema = z.object({
  name: z.string().describe('Line item name/title'),
  description: z.string().optional().describe('Line item description'),
  qty: z.number().describe('Quantity'),
  amount: z.object({
    amount: z.string().describe('Unit price amount'),
    code: z.string().describe('Currency code'),
  }).describe('Unit price'),
  taxName1: z.string().nullable().optional().describe('First tax name'),
  taxAmount1: z.object({
    amount: z.string(),
    code: z.string(),
  }).nullable().optional().describe('First tax amount'),
  taxName2: z.string().nullable().optional().describe('Second tax name'),
  taxAmount2: z.object({
    amount: z.string(),
    code: z.string(),
  }).nullable().optional().describe('Second tax amount'),
});

/**
 * Full Invoice schema with all properties
 */
export const InvoiceSchema = z.object({
  id: z.number().describe('Unique invoice identifier'),
  invoiceNumber: z.string().describe('Invoice number (auto-generated or custom)'),
  customerId: z.number().describe('Customer/client ID'),
  createDate: z.string().describe('Invoice creation date (YYYY-MM-DD)'),
  dueDate: z.string().nullable().optional().describe('Payment due date (YYYY-MM-DD)'),
  amount: MoneySchema.describe('Total invoice amount'),
  outstanding: MoneySchema.describe('Outstanding (unpaid) amount'),
  paid: MoneySchema.describe('Amount paid'),
  status: InvoiceStatusEnum.describe('Invoice status'),
  paymentStatus: PaymentStatusEnum.describe('Payment status'),
  currencyCode: z.string().describe('Currency code (e.g., USD)'),
  lines: z.array(LineItemSchema).describe('Invoice line items'),
  notes: z.string().optional().describe('Invoice notes/memo'),
  terms: z.string().nullable().optional().describe('Payment terms'),
  organization: z.string().optional().describe('Client organization name'),
  fName: z.string().optional().describe('Client first name'),
  lName: z.string().optional().describe('Client last name'),
  email: z.string().optional().describe('Client email address'),
  address: z.string().optional().describe('Billing address'),
  city: z.string().optional().describe('Billing city'),
  province: z.string().optional().describe('Billing province/state'),
  code: z.string().optional().describe('Billing postal/zip code'),
  country: z.string().optional().describe('Billing country'),
  visState: VisStateEnum.optional().describe('Visibility state'),
  createdAt: z.string().datetime().optional().describe('Creation timestamp (ISO 8601)'),
  updated: z.string().datetime().nullable().optional().describe('Last update timestamp (ISO 8601)'),
});

/**
 * Input schema for creating a line item
 */
export const LineItemCreateSchema = z.object({
  name: z.string().min(1).describe('Line item name (required)'),
  description: z.string().optional().describe('Line item description'),
  qty: z.number().min(0).default(1).describe('Quantity'),
  unitCost: z.object({
    amount: z.string().describe('Unit price amount'),
    code: z.string().optional().describe('Currency code'),
  }).describe('Unit cost/price'),
  taxName1: z.string().optional().describe('First tax name'),
  taxAmount1: z.string().optional().describe('First tax percentage'),
  taxName2: z.string().optional().describe('Second tax name'),
  taxAmount2: z.string().optional().describe('Second tax percentage'),
});

/**
 * Input schema for creating an invoice
 */
export const InvoiceCreateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  customerId: z.number().describe('Customer/client ID (required)'),
  createDate: z.string().optional().describe('Invoice date (YYYY-MM-DD, defaults to today)'),
  dueDate: z.string().optional().describe('Payment due date (YYYY-MM-DD)'),
  currencyCode: z.string().default('USD').optional().describe('Currency code'),
  lines: z.array(LineItemCreateSchema).min(1).describe('Invoice line items (at least one required)'),
  notes: z.string().optional().describe('Invoice notes/memo'),
  terms: z.string().optional().describe('Payment terms'),
  discount: z.object({
    amount: z.string().describe('Discount amount'),
    code: z.string().optional().describe('Currency code'),
  }).optional().describe('Discount to apply'),
});

/**
 * Input schema for updating an invoice
 */
export const InvoiceUpdateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  invoiceId: z.number().describe('Invoice ID to update'),
  customerId: z.number().optional().describe('Customer/client ID'),
  createDate: z.string().optional().describe('Invoice date (YYYY-MM-DD)'),
  dueDate: z.string().optional().describe('Payment due date (YYYY-MM-DD)'),
  currencyCode: z.string().optional().describe('Currency code'),
  lines: z.array(LineItemCreateSchema).optional().describe('Invoice line items'),
  notes: z.string().optional().describe('Invoice notes/memo'),
  terms: z.string().optional().describe('Payment terms'),
  status: InvoiceStatusEnum.optional().describe('Invoice status'),
  discount: z.object({
    amount: z.string().describe('Discount amount'),
    code: z.string().optional().describe('Currency code'),
  }).optional().describe('Discount to apply'),
});

/**
 * Input schema for listing invoices
 */
export const InvoiceListInputSchema = z.object({
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
  // Search filters
  customerId: z.number().optional().describe('Filter by customer/client ID'),
  status: InvoiceStatusEnum.optional().describe('Filter by invoice status'),
  paymentStatus: PaymentStatusEnum.optional().describe('Filter by payment status'),
  dateMin: z.string().optional().describe('Filter invoices created after this date (YYYY-MM-DD)'),
  dateMax: z.string().optional().describe('Filter invoices created before this date (YYYY-MM-DD)'),
  updatedSince: z.string().datetime().optional().describe('Filter invoices updated since this time (ISO 8601)'),
})
  .merge(InvoiceSortSchema)
  .merge(InvoiceIncludesSchema);

/**
 * Input schema for getting a single invoice
 */
export const InvoiceSingleInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  invoiceId: z.number().describe('Invoice ID to retrieve'),
});

/**
 * Input schema for deleting an invoice
 */
export const InvoiceDeleteInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  invoiceId: z.number().describe('Invoice ID to delete'),
  confirmed: z.boolean().optional().describe('Set to true to confirm deletion of this invoice'),
  confirmationId: z.string().optional().describe('Confirmation token from the initial delete request (required with confirmed: true)'),
});

/**
 * Input schema for generating a share link
 */
export const InvoiceShareLinkInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  invoiceId: z.number().describe('Invoice ID to share'),
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
 * Output schema for invoice list
 */
export const InvoiceListOutputSchema = z.object({
  invoices: z.array(InvoiceSchema).describe('Array of invoices'),
  pagination: PaginationMetadataSchema.describe('Pagination information'),
});

/**
 * Output schema for single invoice operations
 */
export const InvoiceSingleOutputSchema = InvoiceSchema;

/**
 * Output schema for invoice deletion
 */
export const InvoiceDeleteOutputSchema = z.object({
  success: z.boolean().describe('Whether deletion was successful'),
  invoiceId: z.number().describe('ID of deleted invoice'),
});

/**
 * Output schema for share link generation
 */
export const InvoiceShareLinkOutputSchema = z.object({
  shareLink: z.string().describe('Shareable invoice URL'),
  invoiceId: z.number().describe('Invoice ID'),
});
