/**
 * OtherIncome List Tool
 *
 * List other income entries with pagination and optional filtering.
 */

import { z } from "zod";
import { OtherIncomeListInputSchema, OtherIncomeListOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for otherincome_list
 */
export const otherincomeListTool = {
  name: "otherincome_list",
  description: `List other income entries from FreshBooks with optional filtering and pagination.

WHEN TO USE:
- User asks to "see other income", "list non-invoice income", "show misc income"
- User wants to review income not tied to invoices
- User needs to track income from sources like interest, dividends, rebates

WHAT IS OTHER INCOME:
Income received that is NOT from client invoices, such as:
- Bank interest
- Investment returns
- Rebates and refunds
- Miscellaneous business income

FILTERING OPTIONS:
- categoryName: Filter by income category
- dateFrom/dateTo: Filter by income date range
- source: Filter by income source

PAGINATION:
- Use page/perPage for large result sets
- Default: 30 results per page
- Maximum: 100 results per page

EXAMPLE PROMPTS:
- "Show me all other income for this year"
- "List interest income received"
- "Show other income from January to March"
- "What miscellaneous income did we receive?"

RETURNS:
Array of other income entries with amounts, categories, dates, and sources.
Includes pagination metadata for navigating large result sets.`,

  inputSchema: OtherIncomeListInputSchema,
  outputSchema: OtherIncomeListOutputSchema,

  async execute(
    input: z.infer<typeof OtherIncomeListInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof OtherIncomeListOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'otherincome_list',
      async (input: z.infer<typeof OtherIncomeListInputSchema>, _context: ToolContext) => {
        const { accountId, page, perPage, ...filters } = input;

        const result = await client.executeWithRetry('otherincome_list', async (fbClient) => {
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

            if (filters.categoryName !== undefined) {
              search.equals("category_name", filters.categoryName);
            }
            if (filters.source !== undefined) {
              search.equals("source", filters.source);
            }
            if (filters.dateFrom !== undefined || filters.dateTo !== undefined) {
              const minDate = (filters.dateFrom ?? "1970-01-01") as string;
              const maxDate = (filters.dateTo ?? new Date().toISOString().split('T')[0]) as string;
              search.between("date", { min: minDate, max: maxDate });
            }

            queryBuilders.push(search);
          }

          const response = await fbClient.otherIncomes.list(accountId, queryBuilders);

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        // Extract data
        const otherIncomes = (result as any).other_incomes || (result as any).otherIncomes || [];
        const paginationData = (result as any).pages || {
          page: 1,
          pages: 1,
          total: otherIncomes.length,
          per_page: 30,
        };

        return {
          otherIncomes,
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
