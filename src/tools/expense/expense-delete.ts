/**
 * expense_delete Tool
 *
 * Delete an expense from FreshBooks.
 */

import { z } from 'zod';
import { ExpenseDeleteInputSchema, ExpenseDeleteOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for expense_delete
 */
export const expenseDeleteTool = {
  name: 'expense_delete',
  description: `Delete an expense from FreshBooks.

WHEN TO USE:
- User wants to permanently remove an expense
- User says "delete expense", "remove expense"
- Expense was entered in error
- Need to clean up duplicate or test expenses

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)
- expenseId: ID of expense to delete

IMPORTANT NOTES:
- Deletion is permanent and cannot be undone
- Consider using expense_update with visState=2 to archive instead
- Cannot delete expenses that have been invoiced
- All associated data (receipts, etc.) will be removed

ALTERNATIVES:
- Archive: Use expense_update with visState=2 to hide but preserve
- Mark inactive: Use expense_update with visState=1

EXAMPLE PROMPTS:
- "Delete expense 12345"
- "Remove the duplicate expense 67890"
- "Delete that test expense I just created"

RETURNS:
Confirmation of successful deletion with the expense ID.`,

  inputSchema: ExpenseDeleteInputSchema,
  outputSchema: ExpenseDeleteOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof ExpenseDeleteInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ExpenseDeleteOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'expense_delete',
      async (
        input: z.infer<typeof ExpenseDeleteInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, expenseId } = input;

        logger.debug('Deleting expense', {
          accountId,
          expenseId,
        });

        await client.executeWithRetry(
          'expense_delete',
          async (fbClient) => {
            const response = await fbClient.expenses.delete(accountId, String(expenseId));

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        logger.info('Expense deleted successfully', {
          expenseId,
        });

        return {
          success: true,
          expenseId,
        };
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
