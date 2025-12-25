/**
 * expense_single Tool
 *
 * Get detailed information about a specific expense by ID.
 */

import { z } from 'zod';
import { ExpenseSingleInputSchema, ExpenseSingleOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for expense_single
 */
export const expenseSingleTool = {
  name: 'expense_single',
  description: `Get detailed information about a specific expense by ID.

WHEN TO USE:
- User asks for details about a specific expense
- User provides an expense ID from a previous list
- Need full expense information including tax details and receipt status

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)
- expenseId: Expense ID (numeric)

EXAMPLE PROMPTS:
- "Show me details for expense 12345"
- "Get information about the office supplies expense"
- "What's the status of expense 98765?"
- "Has expense 45678 been invoiced yet?"

RETURNS:
Complete expense details including amount, vendor, date, category, client/project associations,
tax information, markup percentage, receipt status, and billing status.`,

  inputSchema: ExpenseSingleInputSchema,
  outputSchema: ExpenseSingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof ExpenseSingleInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ExpenseSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'expense_single',
      async (
        input: z.infer<typeof ExpenseSingleInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, expenseId } = input;

        logger.debug('Retrieving expense', {
          accountId,
          expenseId,
        });

        const result = await client.executeWithRetry(
          'expense_single',
          async (fbClient) => {
            const response = await fbClient.expenses.single(accountId, String(expenseId));

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { expense: { ... } }
        const expense = (result as { expense?: unknown }).expense ?? result;

        logger.info('Expense retrieved successfully', {
          expenseId,
        });

        return expense as z.infer<typeof ExpenseSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
