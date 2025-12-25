/**
 * OtherIncome Update Tool
 *
 * Update an existing other income entry in FreshBooks.
 */

import { z } from "zod";
import { OtherIncomeUpdateInputSchema, OtherIncomeSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for otherincome_update
 */
export const otherincomeUpdateTool = {
  name: "otherincome_update",
  description: `Update an existing other income entry in FreshBooks.

WHEN TO USE:
- User needs to correct other income details
- User says "update other income", "fix income entry", "change income amount"
- User wants to update amount, category, date, or other details

REQUIRED INFO:
- incomeId: Income entry to update
- accountId: FreshBooks account (get from context)

UPDATABLE FIELDS:
- amount: Correct the income amount
- categoryName: Change the category
- date: Adjust income date
- paymentType: Change payment method
- note: Update description
- source: Update income source
- taxes: Update tax information

EXAMPLE PROMPTS:
- "Update other income #12345 to $75"
- "Change income entry 67890 category to 'Interest'"
- "Fix other income 555 - date should be January 20"
- "Update income note to include bank name"

RETURNS:
Updated other income entry with modified fields.`,

  inputSchema: OtherIncomeUpdateInputSchema,
  outputSchema: OtherIncomeSingleOutputSchema,

  async execute(
    input: z.infer<typeof OtherIncomeUpdateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof OtherIncomeSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'otherincome_update',
      async (input: z.infer<typeof OtherIncomeUpdateInputSchema>, _context: ToolContext) => {
        const { accountId, incomeId, ...updates } = input;

        // Build update object for API (convert camelCase to snake_case)
        const otherIncome: Record<string, unknown> = {};

        if (updates.amount !== undefined) otherIncome.amount = updates.amount;
        if (updates.categoryName !== undefined) otherIncome.category_name = updates.categoryName;
        if (updates.date !== undefined) otherIncome.date = updates.date;
        if (updates.paymentType !== undefined) otherIncome.payment_type = updates.paymentType;
        if (updates.note !== undefined) otherIncome.note = updates.note;
        if (updates.source !== undefined) otherIncome.source = updates.source;
        if (updates.taxes !== undefined) {
          otherIncome.taxes = updates.taxes.map(tax => ({
            name: tax.name,
            amount: tax.amount,
            percent: tax.percent,
          }));
        }

        const result = await client.executeWithRetry('otherincome_update', async (fbClient) => {
          const response = await fbClient.otherIncomes.update(accountId, String(incomeId), otherIncome as any);

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        // FreshBooks returns: { other_income: { ... } }
        const updatedIncome = (result as { other_income?: unknown; otherIncome?: unknown }).other_income
          ?? (result as { other_income?: unknown; otherIncome?: unknown }).otherIncome
          ?? result;

        return updatedIncome as z.infer<typeof OtherIncomeSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
