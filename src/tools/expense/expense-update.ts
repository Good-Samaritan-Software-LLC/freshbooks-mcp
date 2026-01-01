/**
 * expense_update Tool
 *
 * Update an existing expense in FreshBooks.
 */

import { z } from 'zod';
import { ExpenseUpdateInputSchema, ExpenseSingleOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for expense_update
 */
export const expenseUpdateTool = {
  name: 'expense_update',
  description: `Update an existing expense in FreshBooks.

WHEN TO USE:
- User wants to modify an existing expense
- User says "update expense", "change expense", "edit expense"
- Correcting expense details or amounts
- Updating expense billing information
- Archiving/deleting expenses (via visState)

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)
- expenseId: ID of expense to update

OPTIONAL FIELDS (only include what needs to change):
- categoryId: Change expense category
- date: Update expense date
- amount: Modify expense amount/currency
- vendor: Change vendor name
- notes: Update description
- clientId: Change client billing
- projectId: Change project association
- markupPercent: Adjust markup percentage (0-100)
- taxName1/taxPercent1: Update first tax
- taxName2/taxPercent2: Update second tax
- visState: Archive or restore (0=active, 1=deleted, 2=archived)

EXAMPLE PROMPTS:
- "Update expense 12345 to $175.50"
- "Change the vendor on expense 67890 to 'Acme Corp'"
- "Update expense 11111: add client 99 for billing"
- "Archive expense 54321"

RETURNS:
Updated expense with all current details.`,

  inputSchema: ExpenseUpdateInputSchema,
  outputSchema: ExpenseSingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof ExpenseUpdateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ExpenseSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'expense_update',
      async (
        input: z.infer<typeof ExpenseUpdateInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, expenseId, ...updateData } = input;

        logger.debug('Updating expense', {
          accountId,
          expenseId,
          fields: Object.keys(updateData),
        });

        // Build expense update object (convert camelCase to snake_case)
        const expense: Record<string, unknown> = {};

        // Add fields if provided
        if (updateData.categoryId !== undefined) expense.categoryid = updateData.categoryId;
        if (updateData.date !== undefined) expense.date = updateData.date;
        if (updateData.amount !== undefined) expense.amount = updateData.amount;
        if (updateData.vendor !== undefined) expense.vendor = updateData.vendor;
        if (updateData.notes !== undefined) expense.notes = updateData.notes;
        if (updateData.clientId !== undefined) expense.clientid = updateData.clientId;
        if (updateData.projectId !== undefined) expense.projectid = updateData.projectId;
        if (updateData.markupPercent !== undefined) expense.markup_percent = updateData.markupPercent;
        if (updateData.taxName1 !== undefined) expense.taxName1 = updateData.taxName1;
        if (updateData.taxPercent1 !== undefined) expense.taxPercent1 = updateData.taxPercent1;
        if (updateData.taxName2 !== undefined) expense.taxName2 = updateData.taxName2;
        if (updateData.taxPercent2 !== undefined) expense.taxPercent2 = updateData.taxPercent2;
        if (updateData.visState !== undefined) expense.vis_state = updateData.visState;

        const result = await client.executeWithRetry(
          'expense_update',
          async (fbClient) => {
            const response = await fbClient.expenses.update(expense as any, accountId, String(expenseId));

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { expense: { ... } }
        const updatedExpense = (result as { expense?: unknown }).expense ?? result;

        logger.info('Expense updated successfully', {
          expenseId,
        });

        return updatedExpense as z.infer<typeof ExpenseSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
