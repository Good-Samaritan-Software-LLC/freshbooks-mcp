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

        const result = await client.executeWithRetry(
          'expense_update',
          async (fbClient) => {
            // First, fetch the existing expense to support partial updates
            // The FreshBooks SDK requires all fields including date, so we merge
            // user-provided fields with existing data
            const existingResponse = await fbClient.expenses.single(accountId, String(expenseId));

            if (!existingResponse.ok) {
              throw existingResponse.error;
            }

            if (!existingResponse.data) {
              throw ErrorHandler.createNotFoundError(
                'Expense',
                expenseId,
                {
                  accountId,
                }
              );
            }

            // Extract expense from response (FreshBooks returns { expense: { ... } })
            const existingExpense = (existingResponse.data as { expense?: unknown }).expense ?? existingResponse.data;
            const existing = existingExpense as Record<string, unknown>;

            // Build expense update object with ONLY updatable fields
            // Do NOT spread the entire object - API returns extra read-only fields
            // (accountId, isDuplicate, profileId, bankName, status, updated, hasReceipt, etc.)
            // that cause the SDK to hang if included in update requests
            const expense: Record<string, unknown> = {
              categoryId: existing.categoryId,
              staffId: existing.staffId,
              date: existing.date,
              amount: existing.amount,
              vendor: existing.vendor,
              notes: existing.notes,
              clientId: existing.clientId,
              projectId: existing.projectId,
              markupPercent: existing.markupPercent,
              taxName1: existing.taxName1,
              taxPercent1: existing.taxPercent1,
              taxName2: existing.taxName2,
              taxPercent2: existing.taxPercent2,
              visState: existing.visState,
            };

            // Overlay only the fields user provided
            if (updateData.categoryId !== undefined) expense.categoryId = updateData.categoryId;
            if (updateData.date !== undefined) expense.date = updateData.date;
            if (updateData.amount !== undefined) expense.amount = updateData.amount;
            if (updateData.vendor !== undefined) expense.vendor = updateData.vendor;
            if (updateData.notes !== undefined) expense.notes = updateData.notes;
            if (updateData.clientId !== undefined) expense.clientId = updateData.clientId;
            if (updateData.projectId !== undefined) expense.projectId = updateData.projectId;
            if (updateData.markupPercent !== undefined) expense.markupPercent = updateData.markupPercent;
            if (updateData.taxName1 !== undefined) expense.taxName1 = updateData.taxName1;
            if (updateData.taxPercent1 !== undefined) expense.taxPercent1 = updateData.taxPercent1;
            if (updateData.taxName2 !== undefined) expense.taxName2 = updateData.taxName2;
            if (updateData.taxPercent2 !== undefined) expense.taxPercent2 = updateData.taxPercent2;
            if (updateData.visState !== undefined) expense.visState = updateData.visState;

            // Validate that at least one field is being updated
            const updatedFields = Object.keys(updateData).filter(
              (k) => updateData[k as keyof typeof updateData] !== undefined
            );
            if (updatedFields.length === 0) {
              throw ErrorHandler.createValidationError(
                'No fields provided to update. Please specify at least one field to change.'
              );
            }

            logger.debug('Update data being sent to FreshBooks API', {
              updateData: expense,
              accountId,
              expenseId,
              updatedFields,
            });

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
