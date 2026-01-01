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
import { buildQueryBuilders } from '../base-tool.js';

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

SORTING:
- sortBy: Field to sort by (create_date, due_date, updated, amount, outstanding)
- sortOrder: Sort direction (asc or desc, default: desc for newest first)

INCLUDES:
- include: Related data to fetch (lines, presentation)
  - lines: Invoice line items with quantities and amounts
  - presentation: Invoice styling/presentation settings

PAGINATION:
- page: Page number (default: 1)
- perPage: Results per page (default: 30, max: 100)

RETURNS:
Array of invoices with amount, status, payment status, and line items.
Plus pagination metadata (page, pages, total)

EXAMPLES:
- "Show all unpaid invoices"
- "List invoices for customer 12345"
- "Show me overdue invoices sorted by amount"
- "Get invoices with line items included"`,

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
            // Build query builders using the helper
            const queryBuilders = await buildQueryBuilders({
              page: input.page,
              perPage: input.perPage,
              sortBy: input.sortBy,
              sortOrder: input.sortOrder,
              include: input.include,
              searchFilters: (search) => {
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
              },
            });

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
