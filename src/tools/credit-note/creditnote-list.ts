/**
 * CreditNote List Tool
 *
 * List credit notes with pagination and optional filtering.
 */

import { z } from "zod";
import { CreditNoteListInputSchema, CreditNoteListOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for creditnote_list
 */
export const creditnoteListTool = {
  name: "creditnote_list",
  description: `List credit notes from FreshBooks with optional filtering and pagination.

WHEN TO USE:
- User asks to "see credit notes", "list credits", "show refunds"
- User wants to review credit note history
- User needs to find a credit note for a client

FILTERING OPTIONS:
- clientId: Show credit notes for a specific client
- status: Filter by status (created, sent, applied, void)
- dateFrom/dateTo: Filter by creation date range

CREDIT NOTE STATUSES:
- created: Draft credit note, not yet sent
- sent: Credit note sent to client
- applied: Credit applied to an invoice
- void: Credit note voided/cancelled

PAGINATION:
- Use page/perPage for large result sets
- Default: 30 results per page
- Maximum: 100 results per page

EXAMPLE PROMPTS:
- "Show me all credit notes"
- "List applied credit notes from this month"
- "Show credit notes for client 12345"
- "What credit notes are pending?"

RETURNS:
Array of credit notes with amounts, clients, status, and line items.
Includes pagination metadata for navigating large result sets.`,

  inputSchema: CreditNoteListInputSchema,
  outputSchema: CreditNoteListOutputSchema,

  async execute(
    input: z.infer<typeof CreditNoteListInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof CreditNoteListOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'creditnote_list',
      async (input: z.infer<typeof CreditNoteListInputSchema>, _context: ToolContext) => {
        const { accountId, page, perPage, ...filters } = input;

        const result = await client.executeWithRetry('creditnote_list', async (fbClient) => {
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

          // Add search filters if any specified
          if (Object.keys(filters).length > 0) {
            const search = new SearchQueryBuilder();

            if (filters.clientId !== undefined) {
              search.equals("clientid", filters.clientId);
            }
            if (filters.status !== undefined) {
              search.equals("status", filters.status);
            }
            if (filters.dateFrom !== undefined || filters.dateTo !== undefined) {
              const minDate = (filters.dateFrom ?? "1970-01-01") as string;
              const maxDate = (filters.dateTo ?? new Date().toISOString().split('T')[0]) as string;
              search.between("create_date", { min: minDate, max: maxDate });
            }

            queryBuilders.push(search);
          }

          const response = await fbClient.creditNotes.list(accountId, queryBuilders);

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        // Extract data
        const creditNotes = (result as any).credit_notes || (result as any).creditNotes || [];
        const paginationData = (result as any).pages || {
          page: 1,
          pages: 1,
          total: creditNotes.length,
          per_page: 30,
        };

        return {
          creditNotes,
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
