/**
 * ExpenseCategory Single Tool
 *
 * Get details about a specific expense category by ID.
 */

import { z } from "zod";
import { ExpenseCategorySingleInputSchema, ExpenseCategorySingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { logger } from "../../utils/logger.js";

/**
 * Tool definition for expensecategory_single
 */
export const expensecategorySingleTool = {
  name: "expensecategory_single",
  description: `Get details about a specific expense category by ID.

WHEN TO USE:
- User asks for details about a specific category
- User provides a category ID and wants to confirm the name
- Need to verify category information before creating an expense

REQUIRED INFO:
- categoryId: Category ID (numeric)
- accountId: FreshBooks account (get from context)

IMPORTANT NOTES:
- Expense categories are READ-ONLY and predefined by FreshBooks
- You cannot modify category details
- Use this to verify category names and IDs

EXAMPLE PROMPTS:
- "What is expense category 5?"
- "Show me details for category 12"
- "What's the name of category ID 8?"

RETURNS:
Category details including ID, name, and metadata.`,

  inputSchema: ExpenseCategorySingleInputSchema,
  outputSchema: ExpenseCategorySingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof ExpenseCategorySingleInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ExpenseCategorySingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'expensecategory_single',
      async (
        input: z.infer<typeof ExpenseCategorySingleInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, categoryId } = input;

        logger.debug('Retrieving expense category', {
          accountId,
          categoryId,
        });

        const result = await client.executeWithRetry(
          'expensecategory_single',
          async (fbClient) => {
            const response = await fbClient.expenseCategories.single(
              accountId,
              String(categoryId)
            );

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { category: { ... } }
        const category = (result as { category?: unknown }).category ?? result;

        logger.info('Expense category retrieved successfully', {
          categoryId,
        });

        return category as z.infer<typeof ExpenseCategorySingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
