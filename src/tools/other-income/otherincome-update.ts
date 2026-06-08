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
import { toLocalMidnightDate } from "../../utils/dates.js";

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
      OtherIncomeUpdateInputSchema,
      async (input: z.infer<typeof OtherIncomeUpdateInputSchema>, _context: ToolContext) => {
        const { accountId, incomeId, ...updates } = input;

        const result = await client.executeWithRetry('otherincome_update', async (fbClient) => {
          // Read-modify-write: the accounting API rejects a partial other-income
          // PUT ("error accessing your account data", #81) — it wants the full
          // editable representation. Fetch the current entry, overlay the user's
          // changes, send the complete object. (Mirrors expense_update.)
          const existingResponse = await fbClient.otherIncomes.single(accountId, String(incomeId));
          if (!existingResponse.ok) {
            throw existingResponse.error;
          }
          const existing = ((existingResponse.data as { other_income?: unknown; otherIncome?: unknown }).other_income
            ?? (existingResponse.data as { otherIncome?: unknown }).otherIncome
            ?? existingResponse.data) as Record<string, unknown>;

          // Seed from the existing editable fields. existing.date is already a
          // local-midnight Date from the SDK response; toLocalMidnightDate passes
          // it through.
          const otherIncome: Record<string, unknown> = {
            amount: existing.amount,
            categoryName: existing.categoryName,
            date: toLocalMidnightDate(existing.date as string | Date | undefined),
            paymentType: existing.paymentType,
            note: existing.note,
            source: existing.source,
            taxes: existing.taxes,
          };

          // Overlay only the fields the user provided.
          if (updates.amount !== undefined) otherIncome.amount = updates.amount;
          if (updates.categoryName !== undefined) otherIncome.categoryName = updates.categoryName;
          if (updates.date !== undefined) otherIncome.date = toLocalMidnightDate(updates.date);
          if (updates.paymentType !== undefined) otherIncome.paymentType = updates.paymentType;
          if (updates.note !== undefined) otherIncome.note = updates.note;
          if (updates.source !== undefined) otherIncome.source = updates.source;
          if (updates.taxes !== undefined) {
            // Tax sub-object is { name, amount } only — the API has no percent
            // field (live-verified 2026-06-07, audit finding 7).
            otherIncome.taxes = updates.taxes.map(tax => ({
              name: tax.name,
              amount: tax.amount,
            }));
          }

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
