/**
 * expense_create Tool
 *
 * Create a new business expense in FreshBooks.
 */

import { z } from 'zod';
import { ExpenseCreateInputSchema, ExpenseSingleOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for expense_create
 */
export const expenseCreateTool = {
  name: 'expense_create',
  description: `Create a new business expense in FreshBooks.

WHEN TO USE:
- User wants to record a business expense
- User says "add expense", "create expense", "log expense"
- Recording receipts or vendor payments
- Tracking billable client expenses

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)
- categoryId: Expense category (use expensecategory_list to see options)
- staffId: Staff member who incurred the expense
- date: When the expense occurred (ISO 8601 format)
- amount: Expense amount with currency code

OPTIONAL BUT HELPFUL:
- vendor: Who was paid (vendor/merchant name)
- notes: What the expense was for
- clientId: Client to bill (makes expense billable)
- projectId: Associated project (for project expense tracking)
- markupPercent: Markup percentage when billing to client (0-100)
- taxName1/taxPercent1: First tax (e.g., "GST", "5")
- taxName2/taxPercent2: Second tax (e.g., "PST", "7")

EXAMPLE PROMPTS:
- "Add a $150 office supplies expense from Staples"
- "Record a $500 travel expense for client project Alpha"
- "Create an expense: $85 for software subscription, category 12"
- "Log a client lunch expense for $67.50 with 15% tax"

RETURNS:
Created expense with ID and all details.`,

  inputSchema: ExpenseCreateInputSchema,
  outputSchema: ExpenseSingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof ExpenseCreateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ExpenseSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'expense_create',
      async (
        input: z.infer<typeof ExpenseCreateInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, ...expenseData } = input;

        logger.debug('Creating expense', {
          accountId,
          categoryId: expenseData.categoryId,
          amount: expenseData.amount,
        });

        // Build expense object using camelCase properties
        // The FreshBooks SDK's transformExpenseRequest() will convert to API format
        const expense: Record<string, unknown> = {
          categoryId: expenseData.categoryId,
          staffId: expenseData.staffId,
          date: expenseData.date,
          amount: expenseData.amount,
        };

        // Add optional fields if provided
        if (expenseData.vendor !== undefined) expense.vendor = expenseData.vendor;
        if (expenseData.notes !== undefined) expense.notes = expenseData.notes;
        if (expenseData.clientId !== undefined) expense.clientId = expenseData.clientId;
        if (expenseData.projectId !== undefined) expense.projectId = expenseData.projectId;
        if (expenseData.markupPercent !== undefined) expense.markupPercent = expenseData.markupPercent;
        if (expenseData.taxName1 !== undefined) expense.taxName1 = expenseData.taxName1;
        if (expenseData.taxPercent1 !== undefined) expense.taxPercent1 = expenseData.taxPercent1;
        if (expenseData.taxName2 !== undefined) expense.taxName2 = expenseData.taxName2;
        if (expenseData.taxPercent2 !== undefined) expense.taxPercent2 = expenseData.taxPercent2;

        const result = await client.executeWithRetry(
          'expense_create',
          async (fbClient) => {
            const response = await fbClient.expenses.create(expense as any, accountId);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { expense: { ... } }
        const createdExpense = (result as { expense?: unknown }).expense ?? result;

        logger.info('Expense created successfully', {
          expenseId: (createdExpense as { id?: number }).id,
        });

        return createdExpense as z.infer<typeof ExpenseSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
