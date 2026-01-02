/**
 * Zod schemas for Payment entity
 *
 * Payment tracking schemas for FreshBooks API
 */

import { z } from 'zod';
import { MoneySchema, PaginationMetadataSchema, VisStateSchema } from '../base-tool.js';

/**
 * Payment type enum
 */
export const PaymentTypeEnum = z.enum([
  'Check',
  'Credit',
  'Cash',
  'Bank Transfer',
  'Debit',
  'PayPal',
  'Credit Card',
  'Other',
  '2Checkout',
  'Stripe',
  'ACH',
  'Wire Transfer',
]);

/**
 * Full Payment schema with all properties
 */
export const PaymentSchema = z.object({
  id: z.number().describe('Unique payment identifier'),
  invoiceId: z.number().describe('Invoice this payment is applied to'),
  accountId: z.string().describe('FreshBooks account ID'),
  amount: MoneySchema.describe('Payment amount'),
  date: z.string().datetime().describe('Payment date (ISO 8601)'),
  type: PaymentTypeEnum.describe('Payment method/type'),
  note: z.string().nullable().describe('Payment notes or memo'),
  clientId: z.number().describe('Client who made the payment'),
  visState: VisStateSchema.optional().describe('Visibility state (0=active, 1=deleted)'),
  logId: z.number().optional().describe('Log entry ID'),
  updated: z.string().datetime().optional().describe('Last update timestamp (ISO 8601)'),
  creditId: z.number().nullable().optional().describe('Credit note applied'),
  overpaymentId: z.number().nullable().optional().describe('Overpayment ID if applicable'),
  gateway: z.string().nullable().optional().describe('Payment gateway used'),
  fromCredit: z.boolean().optional().describe('Whether payment is from credit'),
  sendEmailReceipt: z.boolean().optional().describe('Whether to send email receipt'),
});

/**
 * Input schema for creating a payment
 */
export const PaymentCreateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  invoiceId: z.number().describe('Invoice to apply payment to (required)'),
  amount: z.object({
    amount: z.string().describe('Payment amount as decimal string'),
    code: z.string().default('USD').describe('Currency code (e.g., USD)'),
  }).describe('Payment amount'),
  date: z.string().describe('Payment date (YYYY-MM-DD)'),
  type: PaymentTypeEnum.default('Cash').describe('Payment method/type'),
  note: z.string().optional().describe('Payment notes or memo'),
  sendEmailReceipt: z.boolean().optional().describe('Send receipt to client'),
});

/**
 * Input schema for updating a payment
 */
export const PaymentUpdateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  paymentId: z.number().describe('Payment ID to update'),
  amount: z.object({
    amount: z.string().describe('Payment amount as decimal string'),
    code: z.string().describe('Currency code (e.g., USD)'),
  }).optional().describe('Payment amount'),
  date: z.string().optional().describe('Payment date (YYYY-MM-DD)'),
  type: PaymentTypeEnum.optional().describe('Payment method/type'),
  note: z.string().optional().describe('Payment notes or memo'),
});

/**
 * Input schema for listing payments
 */
export const PaymentListInputSchema = z.object({
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
  invoiceId: z.number().optional().describe('Filter by invoice ID'),
  clientId: z.number().optional().describe('Filter by client ID'),
  dateFrom: z.string().optional().describe('Filter payments after date (YYYY-MM-DD)'),
  dateTo: z.string().optional().describe('Filter payments before date (YYYY-MM-DD)'),
});

/**
 * Input schema for getting a single payment
 */
export const PaymentSingleInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  paymentId: z.number().describe('Payment ID to retrieve'),
});

/**
 * Input schema for deleting a payment
 */
export const PaymentDeleteInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  paymentId: z.number().describe('Payment ID to delete'),
});

/**
 * Output schema for payment list
 */
export const PaymentListOutputSchema = z.object({
  payments: z.array(PaymentSchema).describe('Array of payments'),
  pagination: PaginationMetadataSchema.describe('Pagination information'),
});

/**
 * Output schema for single payment operations
 */
export const PaymentSingleOutputSchema = PaymentSchema;

/**
 * Output schema for payment deletion
 */
export const PaymentDeleteOutputSchema = z.object({
  success: z.boolean().describe('Whether deletion was successful'),
  paymentId: z.number().describe('ID of deleted payment'),
});
