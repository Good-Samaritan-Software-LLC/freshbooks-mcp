/**
 * Profit & Loss Report Tool
 *
 * Generate a profit and loss (P&L) statement for a date range.
 */

import { z } from "zod";
import { ProfitLossReportInputSchema, ProfitLossReportOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { SearchQueryBuilder } from "@freshbooks/api/dist/models/builders/SearchQueryBuilder.js";

/**
 * Tool definition for report_profit_loss
 */
export const profitLossReportTool = {
  name: "report_profit_loss",
  description: `Generate a profit and loss (P&L) statement for a date range.

WHEN TO USE:
- User wants to see profitability for a period
- User asks "show P&L", "profit and loss", "income statement"
- Need to analyze revenue vs expenses
- Preparing financial statements or tax returns

REQUIRED INFO:
- Start date (YYYY-MM-DD format)
- End date (YYYY-MM-DD format)
- Account ID

WHAT IT RETURNS:
Complete P&L statement including:
- Total revenue for the period
- Total expenses for the period
- Net income (profit/loss)
- Detailed breakdown by category (optional)

P&L FORMULA:
Net Income = Revenue - Expenses

COMMON DATE RANGES:
- This month: Start of current month to today
- Last month: First to last day of previous month
- This quarter: Start of quarter to today
- This year: January 1 to today
- Fiscal year: Based on your fiscal year start

EXAMPLE PROMPTS:
- "Show me P&L for January 2024"
- "What was our profit last quarter?"
- "Profit and loss from 2024-01-01 to 2024-03-31"
- "Generate income statement for 2024"

USE CASES:
- Financial performance analysis
- Budget vs actual comparison
- Tax preparation
- Investor reporting
- Business health monitoring
- Strategic planning

POSITIVE NET INCOME = Profit
NEGATIVE NET INCOME = Loss

RETURNS:
Profit and loss statement with revenue, expenses, and net income.`,

  inputSchema: ProfitLossReportInputSchema,
  outputSchema: ProfitLossReportOutputSchema,

  async execute(
    input: z.infer<typeof ProfitLossReportInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ProfitLossReportOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'report_profit_loss',
      async (input: z.infer<typeof ProfitLossReportInputSchema>, _context: ToolContext) => {
        const { accountId, startDate, endDate } = input;

        // Validate date range
        if (new Date(startDate) > new Date(endDate)) {
          throw ErrorHandler.createValidationError(
            'Start date must be before or equal to end date',
            { tool: 'report_profit_loss', accountId }
          );
        }

        // Execute the API call
        const result = await client.executeWithRetry(
          "report_profit_loss",
          async (fbClient) => {
            // Build query with date range
            const search = new SearchQueryBuilder()
              .equals('start_date', startDate)
              .equals('end_date', endDate);

            const response = await fbClient.reports.profitLoss(accountId, [search]);

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
          revenue: reportData.revenue || { amount: "0", code: "USD" },
          expenses: reportData.expenses || { amount: "0", code: "USD" },
          netIncome: reportData.netIncome || reportData.net_income || { amount: "0", code: "USD" },
          lines: reportData.lines || reportData.categories || undefined,
        };
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
