/**
 * Zod schemas for OtherIncome entity
 *
 * Other income tracking schemas for FreshBooks API
 */

import { z } from 'zod';
import { MoneySchema, PaginationMetadataSchema, VisStateSchema } from '../base-tool.js';

/**
 * Payment type enum for other income
 */
export const OtherIncomePaymentTypeEnum = z.enum([
  'Cash',
  'Check',
  'Credit',
  'Bank Transfer',
  'Debit',
  'PayPal',
  'Credit Card',
  'Other',
  '2Checkout',
  'Interac',
  'Visa',
  'MasterCard',
  'Discover',
  'Nova',
  'AMEX',
  'ACH',
]);

/**
 * Full OtherIncome schema with all properties
 */
export const OtherIncomeSchema = z.object({
  incomeId: z.number().describe('Unique income identifier'),
  amount: MoneySchema.describe('Income amount'),
  categoryName: z.string().describe('Income category name'),
  createdAt: z.string().datetime().describe('Creation timestamp (ISO 8601)'),
  date: z.string().datetime().describe('Income date (ISO 8601)'),
  note: z.string().nullable().optional().describe('Income notes or description'),
  paymentType: OtherIncomePaymentTypeEnum.describe('Payment method'),
  source: z.string().nullable().optional().describe('Income source'),
  taxes: z.array(z.object({
    name: z.string().describe('Tax name'),
    amount: z.string().describe('Tax amount'),
    percent: z.string().optional().describe('Tax percentage'),
  })).optional().describe('Applied taxes'),
  updated: z.string().datetime().optional().describe('Last update timestamp (ISO 8601)'),
  visState: VisStateSchema.optional().describe('Visibility state (0=active, 1=deleted)'),
});

/**
 * Input schema for creating other income
 */
export const OtherIncomeCreateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  amount: z.object({
    amount: z.string().describe('Income amount as decimal string'),
    code: z.string().default('USD').describe('Currency code (e.g., USD)'),
  }).describe('Income amount (required)'),
  categoryName: z.string().describe('Income category name (required)'),
  date: z.string().datetime().describe('Income date (ISO 8601, required)'),
  paymentType: OtherIncomePaymentTypeEnum.default('Cash').describe('Payment method'),
  note: z.string().optional().describe('Income notes or description'),
  source: z.string().optional().describe('Income source'),
  taxes: z.array(z.object({
    name: z.string().describe('Tax name'),
    amount: z.string().describe('Tax amount as decimal string'),
    percent: z.string().optional().describe('Tax percentage'),
  })).optional().describe('Taxes to apply'),
});

/**
 * Input schema for updating other income
 */
export const OtherIncomeUpdateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  incomeId: z.number().describe('Income ID to update'),
  amount: z.object({
    amount: z.string().describe('Income amount as decimal string'),
    code: z.string().describe('Currency code (e.g., USD)'),
  }).optional().describe('Income amount'),
  categoryName: z.string().optional().describe('Income category name'),
  date: z.string().datetime().optional().describe('Income date (ISO 8601)'),
  paymentType: OtherIncomePaymentTypeEnum.optional().describe('Payment method'),
  note: z.string().optional().describe('Income notes or description'),
  source: z.string().optional().describe('Income source'),
  taxes: z.array(z.object({
    name: z.string().describe('Tax name'),
    amount: z.string().describe('Tax amount as decimal string'),
    percent: z.string().optional().describe('Tax percentage'),
  })).optional().describe('Taxes to apply'),
});

/**
 * Input schema for listing other income
 */
export const OtherIncomeListInputSchema = z.object({
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
  categoryName: z.string().optional().describe('Filter by category name'),
  dateFrom: z.string().datetime().optional().describe('Filter income after date (ISO 8601)'),
  dateTo: z.string().datetime().optional().describe('Filter income before date (ISO 8601)'),
  source: z.string().optional().describe('Filter by income source'),
});

/**
 * Input schema for getting a single other income entry
 */
export const OtherIncomeSingleInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  incomeId: z.number().describe('Income ID to retrieve'),
});

/**
 * Input schema for deleting other income
 */
export const OtherIncomeDeleteInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  incomeId: z.number().describe('Income ID to delete'),
});

/**
 * Output schema for other income list
 */
export const OtherIncomeListOutputSchema = z.object({
  otherIncomes: z.array(OtherIncomeSchema).describe('Array of other income entries'),
  pagination: PaginationMetadataSchema.describe('Pagination information'),
});

/**
 * Output schema for single other income operations
 */
export const OtherIncomeSingleOutputSchema = OtherIncomeSchema;

/**
 * Output schema for other income deletion
 */
export const OtherIncomeDeleteOutputSchema = z.object({
  success: z.boolean().describe('Whether deletion was successful'),
  incomeId: z.number().describe('ID of deleted income'),
});
