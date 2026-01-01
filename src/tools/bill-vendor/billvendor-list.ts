/**
 * BillVendor List Tool
 *
 * List vendors with pagination and optional filtering.
 */

import { z } from "zod";
import { BillVendorListInputSchema, BillVendorListOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { logger } from "../../utils/logger.js";

/**
 * Tool definition for billvendor_list
 */
export const billvendorListTool = {
  name: "billvendor_list",
  description: `List vendors from FreshBooks with optional filtering and pagination.

WHEN TO USE:
- User asks to "see vendors", "list suppliers", "show all vendors"
- User wants to find a vendor by name
- User needs vendor information for creating bills

FILTERING OPTIONS:
- vendorName: Search by vendor name (partial match)
- email: Filter by vendor email

PAGINATION:
- Use page/perPage for large result sets
- Default: 30 results per page
- Maximum: 100 results per page

EXAMPLE PROMPTS:
- "Show me all vendors"
- "List suppliers in the system"
- "Find vendor named 'Acme'"
- "Show vendors with email containing 'supplier.com'"

RETURNS:
Array of vendors with contact info, addresses, and tax details.
Includes pagination metadata for navigating large result sets.`,

  inputSchema: BillVendorListInputSchema,
  outputSchema: BillVendorListOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof BillVendorListInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof BillVendorListOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'billvendor_list',
      async (
        input: z.infer<typeof BillVendorListInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, page, perPage, ...filters } = input;

        logger.debug('Listing vendors', {
          accountId,
          page,
          perPage,
          filters,
        });

        const result = await client.executeWithRetry(
          'billvendor_list',
          async (fbClient) => {
            // Dynamic import of query builders
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

              if (filters.vendorName !== undefined) {
                search.like("vendor_name", filters.vendorName);
              }
              if (filters.email !== undefined) {
                search.equals("email", filters.email);
              }

              queryBuilders.push(search);
            }

            const response = await fbClient.billVendors.list(accountId, queryBuilders);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // Extract data - FreshBooks returns: { bill_vendors: [...], pages: {...} }
        const vendors = (result as any).bill_vendors || [];
        const paginationData = (result as any).pages || {
          page: 1,
          pages: 1,
          total: vendors.length,
          per_page: 30,
        };

        logger.info('Vendors listed successfully', {
          count: vendors.length,
          total: paginationData.total,
        });

        return {
          vendors,
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
