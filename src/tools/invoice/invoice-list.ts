/**
 * invoice_list Tool
 *
 * List invoices from FreshBooks with filtering and pagination.
 */

import { z } from 'zod';
import { InvoiceListInputSchema, InvoiceListOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for invoice_list
 */
export const invoiceListTool = {
  name: 'invoice_list',
  description: `List invoices from FreshBooks.

WHEN TO USE:
- User asks to see invoices, bills sent to clients, or outstanding payments
- User wants to review invoices for a specific client
- User needs to find invoices by status (draft, sent, paid, overdue)
- User asks "show my invoices", "what invoices are unpaid", "list client invoices"

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)

OPTIONAL FILTERS:
- customerId: Filter by specific customer/client
- status: Filter by invoice status (draft, sent, viewed, partial, paid, overdue, etc.)
- paymentStatus: Filter by payment status (unpaid, partial, paid)
- dateMin: Show invoices created after this date (YYYY-MM-DD)
- dateMax: Show invoices created before this date (YYYY-MM-DD)
- updatedSince: Show invoices updated since this time (ISO 8601)

PAGINATION:
- page: Page number (default: 1)
- perPage: Results per page (default: 30, max: 100)

RETURNS:
Array of invoices with amount, status, payment status, and line items.
Plus pagination metadata (page, pages, total)

EXAMPLES:
- "Show all unpaid invoices"
- "List invoices for customer 12345"
- "Show me overdue invoices"`,

  inputSchema: InvoiceListInputSchema,
  outputSchema: InvoiceListOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof InvoiceListInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof InvoiceListOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'invoice_list',
      async (
        input: z.infer<typeof InvoiceListInputSchema>,
        _context: ToolContext
      ) => {
        logger.debug('Listing invoices', {
          accountId: input.accountId,
          filters: {
            customerId: input.customerId,
            status: input.status,
            paymentStatus: input.paymentStatus,
          },
        });

        const result = await client.executeWithRetry(
          'invoice_list',
          async (fbClient) => {
            // Import query builders from SDK
            const { SearchQueryBuilder, PaginationQueryBuilder } = await import(
              '@freshbooks/api/dist/models/builders/index.js'
            );

            // Build query builders
            const queryBuilders: any[] = [];

            // Add pagination
            if (input.page || input.perPage) {
              const pagination = new PaginationQueryBuilder()
                .page(input.page || 1)
                .perPage(input.perPage || 30);
              queryBuilders.push(pagination);
            }

            // Add search filters
            const hasFilters =
              input.customerId ||
              input.status ||
              input.paymentStatus ||
              input.dateMin ||
              input.dateMax ||
              input.updatedSince;

            if (hasFilters) {
              const search = new SearchQueryBuilder();

              if (input.customerId) {
                search.equals('customerid', input.customerId);
              }
              if (input.status) {
                search.equals('status', input.status);
              }
              if (input.paymentStatus) {
                search.equals('payment_status', input.paymentStatus);
              }
              if (input.dateMin || input.dateMax) {
                const minDate = (input.dateMin ?? '1970-01-01') as string;
                const maxDate = (input.dateMax ?? new Date().toISOString().split('T')[0]) as string;
                search.between('create_date', { min: minDate, max: maxDate });
              }
              if (input.updatedSince) {
                const minUpdated = input.updatedSince;
                const maxUpdated = new Date().toISOString();
                search.between('updated', { min: minUpdated, max: maxUpdated });
              }

              queryBuilders.push(search);
            }

            // Call FreshBooks API
            const response = await fbClient.invoices.list(
              input.accountId,
              queryBuilders
            );

            if (!response.ok) {
              throw response.error;
            }

            const data = response.data!;
            return {
              invoices: data.invoices || [],
              pagination: {
                page: data.pages?.page || 1,
                pages: data.pages?.pages || 1,
                perPage: (data.pages as any)?.perPage || (data.pages as any)?.per_page || 30,
                total: data.pages?.total || 0,
              },
            };
          }
        );

        logger.info('Invoices listed successfully', {
          count: result.invoices.length,
          total: result.pagination.total,
        });

        return result as unknown as z.infer<typeof InvoiceListOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
