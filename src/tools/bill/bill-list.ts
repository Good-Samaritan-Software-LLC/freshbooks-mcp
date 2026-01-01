/**
 * Bill List Tool
 *
 * List bills with pagination and optional filtering.
 */

import { z } from "zod";
import { BillListInputSchema, BillListOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { logger } from "../../utils/logger.js";

/**
 * Tool definition for bill_list
 */
export const billListTool = {
  name: "bill_list",
  description: `List bills from FreshBooks with optional filtering and pagination.

WHEN TO USE:
- User asks to "see bills", "list bills", "show vendor bills"
- User wants to find bills by vendor or status
- User needs to track outstanding bills or payments due

FILTERING OPTIONS:
- vendorId: Filter by specific vendor
- status: Show bills by payment status (unpaid, partial, paid, overdue)
- startDate/endDate: Filter bills by date range

PAGINATION:
- Use page/perPage for large result sets
- Default: 30 results per page
- Maximum: 100 results per page

EXAMPLE PROMPTS:
- "Show me all unpaid bills"
- "List bills from vendor 123"
- "Find overdue bills"
- "Show bills from last month"

RETURNS:
Array of bills with vendor info, amounts, due dates, and payment status.
Includes pagination metadata for navigating large result sets.`,

  inputSchema: BillListInputSchema,
  outputSchema: BillListOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof BillListInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof BillListOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'bill_list',
      async (
        input: z.infer<typeof BillListInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, page, perPage, ...filters } = input;

        logger.debug('Listing bills', {
          accountId,
          page,
          perPage,
          filters,
        });

        const result = await client.executeWithRetry(
          'bill_list',
          async (fbClient) => {
            // Import query builders from SDK
            const { SearchQueryBuilder, PaginationQueryBuilder } = await import(
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

            // Add search filters if any specified
            if (Object.keys(filters).length > 0) {
              const search = new SearchQueryBuilder();

              if (filters.vendorId !== undefined) {
                search.equals("vendor_id", filters.vendorId);
              }
              if (filters.status !== undefined) {
                search.equals("status", filters.status);
              }
              if (filters.startDate || filters.endDate) {
                const minDate = (filters.startDate ?? '1970-01-01') as string;
                const maxDate = (filters.endDate ?? new Date().toISOString().split('T')[0]) as string;
                search.between("issue_date", { min: minDate, max: maxDate });
              }

              queryBuilders.push(search);
            }

            // Call FreshBooks API
            const response = await fbClient.bills.list(accountId, queryBuilders);

            if (!response.ok) {
              throw response.error;
            }

            const data = response.data!;
            const bills = (data as any).bills || [];
            const paginationData = (data as any).pages || {
              page: 1,
              pages: 1,
              total: bills.length,
              per_page: 30,
            };

            return {
              bills,
              pagination: {
                page: paginationData.page,
                pages: paginationData.pages,
                perPage: paginationData.per_page || paginationData.perPage || 30,
                total: paginationData.total,
              },
            };
          }
        );

        logger.info('Bills listed successfully', {
          count: result.bills.length,
          total: result.pagination.total,
        });

        return result as z.infer<typeof BillListOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
