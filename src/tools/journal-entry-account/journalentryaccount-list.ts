/**
 * JournalEntryAccount List Tool
 *
 * List chart of accounts for use in journal entries.
 */

import { z } from "zod";
import { JournalEntryAccountListInputSchema, JournalEntryAccountListOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for journalentryaccount_list
 */
export const journalEntryAccountListTool = {
  name: "journalentryaccount_list",
  description: `List the chart of accounts from FreshBooks.

WHEN TO USE:
- User needs to create a journal entry and needs account IDs
- User asks "show chart of accounts", "list accounting accounts"
- Need to find the correct subAccountId for journal entries
- User wants to see available accounts for debits/credits

WHAT IT RETURNS:
Complete chart of accounts with:
- Account categories (asset, liability, equity, revenue, expense)
- Sub-accounts with IDs (use these IDs in journal entries)
- Account numbers and descriptions
- Current balances

ACCOUNT TYPES:
- asset: Cash, inventory, equipment, accounts receivable
- liability: Loans, accounts payable, credit cards
- equity: Owner's equity, retained earnings
- revenue: Sales, service income
- expense: Operating expenses, cost of goods sold

FILTERING:
- Use accountType to show only specific categories
- Use pagination for large charts of accounts

EXAMPLE PROMPTS:
- "Show me the chart of accounts"
- "List all expense accounts"
- "What are the available asset accounts?"
- "I need account IDs for a journal entry"

IMPORTANT FOR JOURNAL ENTRIES:
Use the subAccount ID (not the parent account ID) when creating journal entries.
Each detail line in a journal entry requires a subAccountId.

RETURNS:
Chart of accounts with sub-accounts and their IDs for use in journal entries.`,

  inputSchema: JournalEntryAccountListInputSchema,
  outputSchema: JournalEntryAccountListOutputSchema,

  async execute(
    input: z.infer<typeof JournalEntryAccountListInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof JournalEntryAccountListOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'journalentryaccount_list',
      async (input: z.infer<typeof JournalEntryAccountListInputSchema>, _context: ToolContext) => {
        const { accountId, page, perPage, accountType } = input;

        const result = await client.executeWithRetry('journalentryaccount_list', async (fbClient) => {
          const { PaginationQueryBuilder, SearchQueryBuilder } = await import(
            '@freshbooks/api/dist/models/builders/index.js'
          );

          // Build query builders array
          const queryBuilders: any[] = [];

          // Add pagination if specified
          if (page !== undefined || perPage !== undefined) {
            const pagination = new PaginationQueryBuilder();
            if (page !== undefined) pagination.page(page);
            if (perPage !== undefined) pagination.perPage(perPage);
            queryBuilders.push(pagination);
          }

          // Add account type filter if specified
          if (accountType !== undefined) {
            const search = new SearchQueryBuilder();
            search.equals("account_type", accountType);
            queryBuilders.push(search);
          }

          const response = await fbClient.journalEntryAccounts.list(accountId, queryBuilders);

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        // Extract data
        const accounts = (result as any).accounts || (result as any).journalEntryAccounts || [];
        const paginationData = (result as any).pages || {
          page: 1,
          pages: 1,
          total: accounts.length,
          per_page: 30,
        };

        return {
          accounts,
          pagination: {
            page: paginationData.page,
            pages: paginationData.pages,
            perPage: paginationData.per_page || paginationData.perPage || 30,
            total: paginationData.total,
          },
        };
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
