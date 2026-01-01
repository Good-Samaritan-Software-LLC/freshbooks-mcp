/**
 * Item List Tool
 *
 * List reusable invoice line items with pagination and optional filtering.
 */

import { z } from "zod";
import { ItemListInputSchema, ItemListOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { logger } from "../../utils/logger.js";

/**
 * Tool definition for item_list
 */
export const itemListTool = {
  name: "item_list",
  description: `List reusable invoice line items from FreshBooks with optional filtering and pagination.

WHEN TO USE:
- User asks to "see items", "list products", "show services"
- User wants to find items for invoice creation
- User needs to see available products or services

FILTERING OPTIONS:
- name: Search by item name (partial match)
- type: Filter by type (product, service, discount)
- sku: Filter by stock keeping unit

PAGINATION:
- Use page/perPage for large result sets
- Default: 30 results per page
- Maximum: 100 results per page

EXAMPLE PROMPTS:
- "Show me all billable items"
- "List products in inventory"
- "Find service items"
- "What items can I add to invoices?"

RETURNS:
Array of reusable items with names, rates, descriptions, and inventory info.
Includes pagination metadata for navigating large result sets.`,

  inputSchema: ItemListInputSchema,
  outputSchema: ItemListOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof ItemListInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ItemListOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'item_list',
      async (
        input: z.infer<typeof ItemListInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, page, perPage, ...filters } = input;

        logger.debug('Listing items', {
          accountId,
          page,
          perPage,
          filters,
        });

        const result = await client.executeWithRetry(
          'item_list',
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

              if (filters.name !== undefined) {
                search.like("name", filters.name);
              }
              if (filters.type !== undefined) {
                search.equals("type", filters.type);
              }
              if (filters.sku !== undefined) {
                search.equals("sku", filters.sku);
              }

              queryBuilders.push(search);
            }

            // Call FreshBooks API
            const response = await fbClient.items.list(accountId, queryBuilders);

            if (!response.ok) {
              throw response.error;
            }

            const data = response.data!;
            const items = (data as any).items || [];
            const paginationData = (data as any).pages || {
              page: 1,
              pages: 1,
              total: items.length,
              per_page: 30,
            };

            return {
              items,
              pagination: {
                page: paginationData.page,
                pages: paginationData.pages,
                perPage: paginationData.per_page || paginationData.perPage || 30,
                total: paginationData.total,
              },
            };
          }
        );

        logger.info('Items listed successfully', {
          count: result.items.length,
          total: result.pagination.total,
        });

        return result as z.infer<typeof ItemListOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
