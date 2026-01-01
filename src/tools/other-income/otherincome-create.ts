/**
 * OtherIncome Create Tool
 *
 * Record a new other income entry in FreshBooks.
 */

import { z } from "zod";
import { OtherIncomeCreateInputSchema, OtherIncomeSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for otherincome_create
 */
export const otherincomeCreateTool = {
  name: "otherincome_create",
  description: `Record a new other income entry in FreshBooks.

WHEN TO USE:
- User received income not from client invoices
- User says "record other income", "log misc income", "add non-invoice income"
- User wants to track income like interest, rebates, dividends

WHAT IS OTHER INCOME:
Income NOT from client invoices, such as:
- Bank interest earned
- Investment returns
- Vendor rebates
- Tax refunds
- Miscellaneous business income

REQUIRED INFO:
- amount: Income amount with currency code (required)
- categoryName: Category for the income (required)
- date: When income was received (ISO 8601, required)
- accountId: FreshBooks account (get from context)

OPTIONAL BUT HELPFUL:
- paymentType: How income was received (Cash, Check, Bank Transfer, etc.)
- note: Description of the income
- source: Where the income came from
- taxes: Any taxes applied to the income

EXAMPLE PROMPTS:
- "Record $50 bank interest received on Jan 15"
- "Log other income: $200 vendor rebate, received today"
- "Add misc income of $1,000 from investment returns, category 'Dividends'"

RETURNS:
Created other income entry with ID, amount, category, and all details.
Use this to track non-invoice revenue for financial reporting.`,

  inputSchema: OtherIncomeCreateInputSchema,
  outputSchema: OtherIncomeSingleOutputSchema,

  async execute(
    input: z.infer<typeof OtherIncomeCreateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof OtherIncomeSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'otherincome_create',
      async (input: z.infer<typeof OtherIncomeCreateInputSchema>, _context: ToolContext) => {
        const { accountId, ...incomeData } = input;

        // Build other income object for API (convert camelCase to snake_case)
        const otherIncome: Record<string, unknown> = {
          amount: incomeData.amount,
          category_name: incomeData.categoryName,
          date: incomeData.date,
          payment_type: incomeData.paymentType || 'Cash',
        };

        // Add optional fields if provided
        if (incomeData.note !== undefined) otherIncome.note = incomeData.note;
        if (incomeData.source !== undefined) otherIncome.source = incomeData.source;
        if (incomeData.taxes !== undefined) {
          otherIncome.taxes = incomeData.taxes.map(tax => ({
            name: tax.name,
            amount: tax.amount,
            percent: tax.percent,
          }));
        }

        const result = await client.executeWithRetry('otherincome_create', async (fbClient) => {
          const response = await fbClient.otherIncomes.create(otherIncome as any, accountId);

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        // FreshBooks returns: { other_income: { ... } }
        const createdIncome = (result as { other_income?: unknown; otherIncome?: unknown }).other_income
          ?? (result as { other_income?: unknown; otherIncome?: unknown }).otherIncome
          ?? result;

        return createdIncome as z.infer<typeof OtherIncomeSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
