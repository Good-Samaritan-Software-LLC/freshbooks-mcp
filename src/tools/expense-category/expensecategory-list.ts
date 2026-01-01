/**
 * ExpenseCategory List Tool
 *
 * List available expense categories (read-only, predefined by FreshBooks).
 */

import { z } from "zod";
import { ExpenseCategoryListInputSchema, ExpenseCategoryListOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { logger } from "../../utils/logger.js";

/**
 * Tool definition for expensecategory_list
 */
export const expensecategoryListTool = {
  name: "expensecategory_list",
  description: `List available expense categories from FreshBooks.

WHEN TO USE:
- User asks "what expense categories are available?"
- User needs to know valid category IDs for creating expenses
- User wants to see all expense category options
- Setting up expense tracking and need category reference

IMPORTANT NOTES:
- Expense categories are READ-ONLY and predefined by FreshBooks
- You cannot create, update, or delete categories
- Use the category ID when creating or updating expenses
- Categories are typically system-wide and consistent across accounts

COMMON CATEGORIES:
Categories typically include (IDs may vary):
- Advertising and Marketing
- Automobile Expenses
- Bank Charges
- Meals and Entertainment
- Office Supplies
- Professional Fees
- Rent
- Telephone
- Travel
- Utilities
- And many more...

PAGINATION:
- Use page/perPage for large category lists
- Default: 30 results per page
- Maximum: 100 results per page

EXAMPLE PROMPTS:
- "Show me all expense categories"
- "What categories can I use for expenses?"
- "List expense category options"
- "What's the category ID for travel expenses?"

RETURNS:
Array of expense categories with IDs and names. Use the category ID
when creating expenses with expense_create.`,

  inputSchema: ExpenseCategoryListInputSchema,
  outputSchema: ExpenseCategoryListOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof ExpenseCategoryListInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ExpenseCategoryListOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'expensecategory_list',
      async (
        input: z.infer<typeof ExpenseCategoryListInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, page, perPage } = input;

        logger.debug('Listing expense categories', {
          accountId,
          page,
          perPage,
        });

        const result = await client.executeWithRetry(
          'expensecategory_list',
          async (fbClient) => {
            // Import query builders from SDK
            const { PaginationQueryBuilder } = await import(
              '@freshbooks/api/dist/models/builders/index.js'
            );

            // Build query builders array
            const queryBuilders: any[] = [];

            // Add pagination if specified
            if (page !== undefined || perPage !== undefined) {
              const pagination = new PaginationQueryBuilder()
                .page(page || 1)
                .perPage(perPage || 30);
              queryBuilders.push(pagination);
            }

            // Call FreshBooks API
            const response = await fbClient.expenseCategories.list(
              accountId,
              queryBuilders
            );

            if (!response.ok) {
              throw response.error;
            }

            const data = response.data!;
            const categories = (data as any).categories || [];
            const paginationData = (data as any).pages || {
              page: 1,
              pages: 1,
              total: categories.length,
              per_page: 30,
            };

            return {
              categories,
              pagination: {
                page: paginationData.page,
                pages: paginationData.pages,
                perPage: paginationData.per_page || paginationData.perPage || 30,
                total: paginationData.total,
              },
            };
          }
        );

        logger.info('Expense categories listed successfully', {
          count: result.categories.length,
          total: result.pagination.total,
        });

        return result as z.infer<typeof ExpenseCategoryListOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
