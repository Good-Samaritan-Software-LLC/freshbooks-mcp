/**
 * Zod schemas for Report entity
 *
 * Financial report schemas for FreshBooks API
 */

import { z } from 'zod';

/**
 * Date range schema for reports
 */
export const DateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Start date in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('End date in YYYY-MM-DD format'),
});

/**
 * Payment item schema for payments collected report
 */
export const PaymentItemSchema = z.object({
  date: z.string().describe('Payment date'),
  clientName: z.string().describe('Client name'),
  invoiceNumber: z.string().describe('Invoice number'),
  amount: z.object({
    amount: z.string().describe('Payment amount'),
    code: z.string().describe('Currency code'),
  }).describe('Payment amount'),
  paymentType: z.string().describe('Payment method (e.g., cash, check, credit card)'),
  notes: z.string().optional().describe('Payment notes'),
});

/**
 * Payments Collected Report schema
 */
export const PaymentsCollectedReportSchema = z.object({
  startDate: z.string().describe('Report start date'),
  endDate: z.string().describe('Report end date'),
  payments: z.array(PaymentItemSchema).describe('List of payments collected'),
  totalAmount: z.object({
    amount: z.string().describe('Total amount collected'),
    code: z.string().describe('Currency code'),
  }).describe('Total payments collected in period'),
});

/**
 * Profit/Loss line item schema
 */
export const ProfitLossLineSchema = z.object({
  category: z.string().describe('Category name (e.g., Revenue, Expenses, Cost of Goods Sold)'),
  amount: z.object({
    amount: z.string().describe('Amount for this category'),
    code: z.string().describe('Currency code'),
  }).describe('Category amount'),
  children: z.array(z.any()).optional().describe('Sub-categories or line items'),
});

/**
 * Profit/Loss Report schema
 */
export const ProfitLossReportSchema = z.object({
  startDate: z.string().describe('Report start date'),
  endDate: z.string().describe('Report end date'),
  revenue: z.object({
    amount: z.string().describe('Total revenue'),
    code: z.string().describe('Currency code'),
  }).describe('Total revenue for period'),
  expenses: z.object({
    amount: z.string().describe('Total expenses'),
    code: z.string().describe('Currency code'),
  }).describe('Total expenses for period'),
  netIncome: z.object({
    amount: z.string().describe('Net income (revenue - expenses)'),
    code: z.string().describe('Currency code'),
  }).describe('Net income/profit for period'),
  lines: z.array(ProfitLossLineSchema).optional().describe('Detailed breakdown by category'),
});

/**
 * Tax summary item schema
 */
export const TaxSummaryItemSchema = z.object({
  taxName: z.string().describe('Tax name (e.g., "Sales Tax", "VAT")'),
  taxRate: z.string().describe('Tax rate percentage'),
  taxableAmount: z.object({
    amount: z.string().describe('Amount subject to tax'),
    code: z.string().describe('Currency code'),
  }).describe('Taxable amount'),
  taxCollected: z.object({
    amount: z.string().describe('Tax amount collected'),
    code: z.string().describe('Currency code'),
  }).describe('Tax collected'),
  taxPaid: z.object({
    amount: z.string().describe('Tax amount paid'),
    code: z.string().describe('Currency code'),
  }).optional().describe('Tax paid (if applicable)'),
});

/**
 * Tax Summary Report schema
 */
export const TaxSummaryReportSchema = z.object({
  startDate: z.string().describe('Report start date'),
  endDate: z.string().describe('Report end date'),
  taxes: z.array(TaxSummaryItemSchema).describe('Tax summary by tax type'),
  totalTaxCollected: z.object({
    amount: z.string().describe('Total tax collected'),
    code: z.string().describe('Currency code'),
  }).describe('Total tax collected in period'),
});

/**
 * Input schema for payments collected report
 */
export const PaymentsCollectedReportInputSchema = DateRangeSchema.extend({
  accountId: z.string().describe('FreshBooks account ID'),
});

/**
 * Input schema for profit/loss report
 */
export const ProfitLossReportInputSchema = DateRangeSchema.extend({
  accountId: z.string().describe('FreshBooks account ID'),
});

/**
 * Input schema for tax summary report
 */
export const TaxSummaryReportInputSchema = DateRangeSchema.extend({
  accountId: z.string().describe('FreshBooks account ID'),
});

/**
 * Output schemas
 */
export const PaymentsCollectedReportOutputSchema = PaymentsCollectedReportSchema;
export const ProfitLossReportOutputSchema = ProfitLossReportSchema;
export const TaxSummaryReportOutputSchema = TaxSummaryReportSchema;
