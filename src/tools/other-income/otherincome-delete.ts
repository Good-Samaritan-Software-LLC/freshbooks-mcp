/**
 * OtherIncome Delete Tool
 *
 * Delete an other income entry from FreshBooks.
 */

import { z } from "zod";
import { OtherIncomeDeleteInputSchema, OtherIncomeDeleteOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for otherincome_delete
 */
export const otherincomeDeleteTool = {
  name: "otherincome_delete",
  description: `Delete an other income entry from FreshBooks.

WHEN TO USE:
- User recorded other income in error
- User says "delete other income", "remove income entry", "cancel income"
- User needs to undo an income entry

REQUIRED INFO:
- incomeId: Income entry to delete
- accountId: FreshBooks account (get from context)

IMPORTANT NOTES:
- Deleting income affects financial reports and tax calculations
- This cannot be undone - use with caution
- Consider updating instead of deleting if just correcting details
- Ensure the income hasn't been included in filed tax returns

EXAMPLE PROMPTS:
- "Delete other income #12345"
- "Remove income entry 67890 - it was entered twice"
- "Cancel other income ID 555"

RETURNS:
Confirmation of deletion with the deleted income ID.`,

  inputSchema: OtherIncomeDeleteInputSchema,
  outputSchema: OtherIncomeDeleteOutputSchema,

  async execute(
    input: z.infer<typeof OtherIncomeDeleteInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof OtherIncomeDeleteOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'otherincome_delete',
      async (input: z.infer<typeof OtherIncomeDeleteInputSchema>, _context: ToolContext) => {
        const { accountId, incomeId } = input;

        await client.executeWithRetry('otherincome_delete', async (fbClient) => {
          const response = await fbClient.otherIncomes.delete(accountId, String(incomeId));

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        return {
          success: true,
          incomeId,
        };
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
