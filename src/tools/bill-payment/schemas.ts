/**
 * Zod schemas for BillPayment entity
 *
 * Bill payment management schemas for FreshBooks API
 */

import { z } from 'zod';
import { MoneySchema } from '../base-tool.js';

/**
 * Payment type enum
 */
export const PaymentTypeEnum = z.enum(['check', 'credit', 'cash', 'bank_transfer', 'debit', 'other']);

/**
 * Full BillPayment schema with all properties
 */
export const BillPaymentSchema = z.object({
  id: z.number().describe('Unique payment identifier'),
  billId: z.number().describe('Associated bill ID'),
  amount: MoneySchema.describe('Payment amount'),
  paymentType: PaymentTypeEnum.describe('Type of payment'),
  paidDate: z.string().datetime().describe('Date payment was made (ISO 8601)'),
  note: z.string().nullable().describe('Payment notes'),
  matchedWithExpense: z.boolean().optional().describe('Whether matched with expense'),
  createdAt: z.string().datetime().describe('Creation timestamp (ISO 8601)'),
  updatedAt: z.string().datetime().describe('Last update timestamp (ISO 8601)'),
});

/**
 * Input schema for creating a bill payment
 */
export const BillPaymentCreateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  billId: z.number().describe('Bill ID to apply payment to'),
  amount: z.object({
    amount: z.string().describe('Payment amount'),
    code: z.string().describe('Currency code (e.g., USD)'),
  }).describe('Payment amount'),
  paymentType: PaymentTypeEnum.describe('Type of payment (check, credit, cash, etc.)'),
  paidDate: z.string().datetime().describe('Date payment was made (ISO 8601)'),
  note: z.string().optional().describe('Payment notes'),
});

/**
 * Input schema for updating a bill payment
 */
export const BillPaymentUpdateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  billPaymentId: z.number().describe('Payment ID to update'),
  amount: z.object({
    amount: z.string().describe('Payment amount'),
    code: z.string().describe('Currency code (e.g., USD)'),
  }).optional().describe('Payment amount'),
  paymentType: PaymentTypeEnum.optional().describe('Type of payment'),
  paidDate: z.string().datetime().optional().describe('Date payment was made (ISO 8601)'),
  note: z.string().optional().describe('Payment notes'),
});

/**
 * Input schema for listing bill payments
 */
export const BillPaymentListInputSchema = z.object({
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
  billId: z.number().optional().describe('Filter by bill ID'),
  startDate: z.string().datetime().optional().describe('Filter payments after this date'),
  endDate: z.string().datetime().optional().describe('Filter payments before this date'),
});

/**
 * Input schema for getting a single bill payment
 */
export const BillPaymentSingleInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  billPaymentId: z.number().describe('Payment ID to retrieve'),
});

/**
 * Input schema for deleting a bill payment
 */
export const BillPaymentDeleteInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  billPaymentId: z.number().describe('Payment ID to delete'),
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
 * Output schema for bill payment list
 */
export const BillPaymentListOutputSchema = z.object({
  billPayments: z.array(BillPaymentSchema).describe('Array of bill payments'),
  pagination: PaginationMetadataSchema.describe('Pagination information'),
});

/**
 * Output schema for single bill payment operations
 */
export const BillPaymentSingleOutputSchema = BillPaymentSchema;

/**
 * Output schema for bill payment deletion
 */
export const BillPaymentDeleteOutputSchema = z.object({
  success: z.boolean().describe('Whether deletion was successful'),
  billPaymentId: z.number().describe('ID of deleted payment'),
});
