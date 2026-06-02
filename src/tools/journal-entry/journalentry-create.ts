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
      JournalEntryCreateInputSchema,
      async (input: z.infer<typeof JournalEntryCreateInputSchema>, _context: ToolContext) => {
        const { accountId, name, date, description, currencyCode, details } = input;

        // Validate that debits equal credits
        let totalDebits = 0;
        let totalCredits = 0;

        for (const detail of details) {
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

        // POST the wire payload directly instead of via the SDK. The SDK's
        // transformJournalEntryRequest has two defects (both live-confirmed):
        //  1. It omits currency_code unless the caller's currencyCode survived
        //     schema parsing — and a journal entry WITHOUT currency_code makes the
        //     accounting API 500 with the opaque "There was an error accessing your
        //     account data." So default it here, in the handler, not the schema.
        //  2. transformDateRequest parses "YYYY-MM-DD" as UTC midnight then reads
        //     local Y/M/D, shifting the stored date back a day in negative-UTC
        //     timezones. Sending the raw "YYYY-MM-DD" string avoids the shift.
        // (Per-line `description` is intentionally not sent: the API ignores it.)
        const body = {
          journal_entry: {
            name,
            user_entered_date: date,
            currency_code: currencyCode || 'USD',
            details: details.map((d) => ({
              sub_accountid: d.subAccountId,
              ...(d.debit !== undefined ? { debit: d.debit } : {}),
              ...(d.credit !== undefined ? { credit: d.credit } : {}),
            })),
          },
        };

        const result = await client.executeRawWithRetry(
          'POST',
          `/accounting/account/${accountId}/journal_entries/journal_entries`,
          body,
          'journalentry_create'
        );

        if (!result.ok) {
          throw result.error ?? new Error('Journal entry creation failed');
        }

        // Accounting API returns { response: { result: { journal_entry: {...} } } }
        // in snake_case; map it to the camelCase output contract.
        const je = (result.data as any)?.response?.result?.journal_entry ?? result.data;

        return {
          id: je.id ?? je.entryid,
          name: je.name,
          description: je.description ?? description,
          date: je.user_entered_date ?? date,
          currencyCode: je.currency_code,
          details: Array.isArray(je.details)
            ? je.details.map((d: any) => ({
                subAccountId: d.sub_accountid,
                debit: d.debit ?? undefined,
                credit: d.credit ?? undefined,
                description: d.description ?? undefined,
              }))
            : [],
        } as z.infer<typeof JournalEntryCreateOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
