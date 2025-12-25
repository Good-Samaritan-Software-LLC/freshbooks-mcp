/**
 * JournalEntry Create Tool
 *
 * Create accounting journal entries for manual adjustments.
 */

import { z } from "zod";
import { JournalEntryCreateInputSchema, JournalEntryCreateOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for journalentry_create
 */
export const journalEntryCreateTool = {
  name: "journalentry_create",
  description: `Create an accounting journal entry for manual adjustments.

WHEN TO USE:
- User needs to make manual accounting adjustments
- User says "create journal entry", "record accounting adjustment"
- Need to correct account balances
- Need to record non-transaction entries

REQUIRED INFO:
- Name/description of the entry
- Date (YYYY-MM-DD format)
- Details array with debits and credits (minimum 2 lines)
- Account ID

IMPORTANT RULES:
1. Total debits MUST equal total credits (double-entry accounting)
2. Minimum 2 detail lines required
3. Each line needs a subAccountId from the chart of accounts
4. Use journalentryaccount_list to get valid account IDs
5. Amounts are decimal strings (e.g., "100.00")

DETAIL LINE FORMAT:
{
  "subAccountId": 123,        // From chart of accounts
  "debit": "100.00",          // Debit amount (optional)
  "credit": "100.00",         // Credit amount (optional)
  "description": "..."        // Line description (optional)
}

ACCOUNTING RULES:
- Debit increases: Assets, Expenses
- Credit increases: Liabilities, Equity, Revenue
- Every entry must balance (total debits = total credits)

EXAMPLE USE CASES:
- Correcting account balances
- Recording depreciation
- Adjusting inventory values
- Recording accruals
- End-of-period adjustments

EXAMPLE PROMPTS:
- "Create journal entry to record depreciation"
- "Adjust revenue by $500"
- "Record accounting correction for equipment"

RETURNS:
Created journal entry with all details and ID for reference.

NOTE: This is a create-only operation. Journal entries cannot be updated or deleted once created.`,

  inputSchema: JournalEntryCreateInputSchema,
  outputSchema: JournalEntryCreateOutputSchema,

  async execute(
    input: z.infer<typeof JournalEntryCreateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof JournalEntryCreateOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'journalentry_create',
      async (input: z.infer<typeof JournalEntryCreateInputSchema>, _context: ToolContext) => {
        const { accountId, ...entryData } = input;

        // Validate that debits equal credits
        let totalDebits = 0;
        let totalCredits = 0;

        for (const detail of entryData.details) {
          if (detail.debit) {
            totalDebits += parseFloat(detail.debit);
          }
          if (detail.credit) {
            totalCredits += parseFloat(detail.credit);
          }
        }

        // Check for balance (with small tolerance for floating point)
        const difference = Math.abs(totalDebits - totalCredits);
        if (difference > 0.01) {
          throw ErrorHandler.createValidationError(
            `Journal entry must balance. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}, Difference: ${difference.toFixed(2)}`,
            { tool: 'journalentry_create', accountId }
          );
        }

        // Execute the API call
        const result = await client.executeWithRetry(
          "journalentry_create",
          async (fbClient) => {
            const response = await fbClient.journalEntries.create(entryData as any, accountId);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // Extract journal entry data
        return (result as any).journalEntry || (result as any);
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
