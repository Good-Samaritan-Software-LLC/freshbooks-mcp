/**
 * Payments Collected Report Tool
 *
 * Generate a report of payments collected during a date range.
 */

import { z } from "zod";
import { PaymentsCollectedReportInputSchema, PaymentsCollectedReportOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { SearchQueryBuilder } from "@freshbooks/api/dist/models/builders/SearchQueryBuilder.js";

/**
 * Tool definition for report_payments_collected
 */
export const paymentsCollectedReportTool = {
  name: "report_payments_collected",
  description: `Generate a payments collected report for a date range.

WHEN TO USE:
- User wants to see payments received during a period
- User asks "how much was collected", "show payment history"
- Need cash flow or collection analysis
- Preparing financial statements

REQUIRED INFO:
- Start date (YYYY-MM-DD format)
- End date (YYYY-MM-DD format)
- Account ID

WHAT IT RETURNS:
Detailed payment report including:
- Each payment with date, client, invoice number
- Payment amounts and methods
- Payment notes
- Total amount collected in the period

COMMON DATE RANGES:
- This month: Start of current month to today
- Last month: First to last day of previous month
- This quarter: Start of quarter to today
- This year: January 1 to today
- Custom: Any date range you specify

EXAMPLE PROMPTS:
- "Show payments collected in January 2024"
- "How much did we collect last month?"
- "Payment report from 2024-01-01 to 2024-03-31"
- "Show me Q1 2024 payment collections"

USE CASES:
- Cash flow analysis
- Revenue tracking
- Collection performance
- Financial reporting
- Tax preparation

RETURNS:
List of all payments collected with totals and payment details.`,

  inputSchema: PaymentsCollectedReportInputSchema,
  outputSchema: PaymentsCollectedReportOutputSchema,

  async execute(
    input: z.infer<typeof PaymentsCollectedReportInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof PaymentsCollectedReportOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'report_payments_collected',
      async (input: z.infer<typeof PaymentsCollectedReportInputSchema>, _context: ToolContext) => {
        const { accountId, startDate, endDate } = input;

        // Validate date range
        if (new Date(startDate) > new Date(endDate)) {
          throw ErrorHandler.createValidationError(
            'Start date must be before or equal to end date',
            { tool: 'report_payments_collected', accountId }
          );
        }

        // Execute the API call
        const result = await client.executeWithRetry(
          "report_payments_collected",
          async (fbClient) => {
            // Build query with date range
            const search = new SearchQueryBuilder()
              .equals('start_date', startDate)
              .equals('end_date', endDate);

            const response = await fbClient.reports.paymentsCollected(accountId, [search]);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // Extract report data
        const reportData = result as any;

        return {
          startDate,
          endDate,
          payments: reportData.payments || [],
          totalAmount: reportData.totalAmount || reportData.total || { amount: "0", code: "USD" },
        };
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
