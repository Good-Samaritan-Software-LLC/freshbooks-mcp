/**
 * Tax Summary Report Tool
 *
 * Generate a tax summary report for a date range.
 */

import { z } from "zod";
import { TaxSummaryReportInputSchema, TaxSummaryReportOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { SearchQueryBuilder } from "@freshbooks/api/dist/models/builders/SearchQueryBuilder.js";

/**
 * Tool definition for report_tax_summary
 */
export const taxSummaryReportTool = {
  name: "report_tax_summary",
  description: `Generate a tax summary report for a date range.

WHEN TO USE:
- User needs to prepare tax returns
- User asks "show tax summary", "how much tax collected"
- Need to calculate tax liabilities
- Preparing for tax filing or audit

REQUIRED INFO:
- Start date (YYYY-MM-DD format)
- End date (YYYY-MM-DD format)
- Account ID

WHAT IT RETURNS:
Tax summary including:
- Tax collected by tax type (e.g., Sales Tax, VAT, GST)
- Tax rates and taxable amounts
- Total tax collected in the period
- Tax paid (if applicable)

TAX INFORMATION INCLUDES:
- Tax name (e.g., "Sales Tax", "VAT", "GST")
- Tax rate percentage
- Taxable amount (total sales subject to this tax)
- Tax collected (amount of tax on invoices)
- Tax paid on expenses (if tracked)

COMMON DATE RANGES:
- Tax quarter: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
- Tax year: Full calendar or fiscal year
- Monthly: For monthly tax filing
- Custom: Any reporting period

EXAMPLE PROMPTS:
- "Show tax summary for Q1 2024"
- "How much sales tax did I collect last month?"
- "Tax report from 2024-01-01 to 2024-03-31"
- "Generate tax summary for 2024"

USE CASES:
- Sales tax filing
- VAT/GST returns
- Tax liability calculation
- Audit preparation
- Financial reporting
- Tax planning

IMPORTANT:
This report shows taxes on invoices and bills.
Consult with a tax professional for filing requirements.

RETURNS:
Tax summary with breakdown by tax type and total tax collected.`,

  inputSchema: TaxSummaryReportInputSchema,
  outputSchema: TaxSummaryReportOutputSchema,

  async execute(
    input: z.infer<typeof TaxSummaryReportInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof TaxSummaryReportOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'report_tax_summary',
      async (input: z.infer<typeof TaxSummaryReportInputSchema>, _context: ToolContext) => {
        const { accountId, startDate, endDate } = input;

        // Validate date range
        if (new Date(startDate) > new Date(endDate)) {
          throw ErrorHandler.createValidationError(
            'Start date must be before or equal to end date',
            { tool: 'report_tax_summary', accountId }
          );
        }

        // Execute the API call
        const result = await client.executeWithRetry(
          "report_tax_summary",
          async (fbClient) => {
            // Build query with date range
            const search = new SearchQueryBuilder()
              .equals('start_date', startDate)
              .equals('end_date', endDate);

            const response = await fbClient.reports.taxSummary(accountId, [search]);

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
          taxes: reportData.taxes || reportData.taxSummaries || [],
          totalTaxCollected: reportData.totalTaxCollected || reportData.total || { amount: "0", code: "USD" },
        };
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
