/**
 * OtherIncome Single Tool
 *
 * Retrieve a single other income entry by ID.
 */

import { z } from "zod";
import { OtherIncomeSingleInputSchema, OtherIncomeSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for otherincome_single
 */
export const otherincomeSingleTool = {
  name: "otherincome_single",
  description: `Retrieve a single other income entry by ID from FreshBooks.

WHEN TO USE:
- User asks for details about a specific other income entry
- User provides an income ID and wants full information
- User needs to verify income details before updating

REQUIRED INFO:
- incomeId: The income entry identifier
- accountId: FreshBooks account (get from context)

EXAMPLE PROMPTS:
- "Show me other income #12345"
- "Get details for income entry 67890"
- "What are the details of other income ID 555?"

RETURNS:
Complete other income record including amount, category, date, payment type,
source, taxes, and all other income properties.`,

  inputSchema: OtherIncomeSingleInputSchema,
  outputSchema: OtherIncomeSingleOutputSchema,

  async execute(
    input: z.infer<typeof OtherIncomeSingleInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof OtherIncomeSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'otherincome_single',
      async (input: z.infer<typeof OtherIncomeSingleInputSchema>, _context: ToolContext) => {
        const { accountId, incomeId } = input;

        const result = await client.executeWithRetry('otherincome_single', async (fbClient) => {
          const response = await fbClient.otherIncomes.single(accountId, String(incomeId));

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        // FreshBooks returns: { other_income: { ... } }
        const otherIncome = (result as { other_income?: unknown; otherIncome?: unknown }).other_income
          ?? (result as { other_income?: unknown; otherIncome?: unknown }).otherIncome
          ?? result;

        return otherIncome as z.infer<typeof OtherIncomeSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
