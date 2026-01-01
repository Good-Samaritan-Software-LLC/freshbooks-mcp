/**
 * payment_list Tool
 *
 * List payments received with pagination and optional filtering.
 */

import { z } from 'zod';
import { PaymentListInputSchema, PaymentListOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for payment_list
 */
export const paymentListTool = {
  name: 'payment_list',
  description: `List payments received from FreshBooks with optional filtering and pagination.

WHEN TO USE:
- User asks to "see payments", "list payments", "show received payments"
- User wants to review payment history
- User needs to find a specific payment or check invoice payment status

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)

OPTIONAL FILTERS:
- invoiceId: Show payments for a specific invoice
- clientId: Show payments from a specific client
- dateFrom/dateTo: Filter by payment date range (ISO 8601)

PAGINATION:
- page: Page number (default: 1)
- perPage: Results per page (default: 30, max: 100)

EXAMPLE PROMPTS:
- "Show me all payments received this month"
- "List payments for invoice #12345"
- "Show payments from client ABC"
- "What payments did we receive between Jan 1 and Jan 31?"

RETURNS:
Array of payments with amounts, dates, payment types, and associated invoice/client info.
Includes pagination metadata for navigating large result sets.`,

  inputSchema: PaymentListInputSchema,
  outputSchema: PaymentListOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof PaymentListInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof PaymentListOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'payment_list',
      async (
        input: z.infer<typeof PaymentListInputSchema>,
        _context: ToolContext
      ) => {
        logger.debug('Listing payments', {
          accountId: input.accountId,
          filters: {
            invoiceId: input.invoiceId,
            clientId: input.clientId,
          },
        });

        const result = await client.executeWithRetry(
          'payment_list',
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
              input.invoiceId ||
              input.clientId ||
              input.dateFrom ||
              input.dateTo;

            if (hasFilters) {
              const search = new SearchQueryBuilder();

              if (input.invoiceId) {
                search.equals('invoiceid', input.invoiceId);
              }
              if (input.clientId) {
                search.equals('clientid', input.clientId);
              }
              if (input.dateFrom || input.dateTo) {
                const minDate = input.dateFrom ?? '1970-01-01T00:00:00Z';
                const maxDate = input.dateTo ?? new Date().toISOString();
                search.between('date', { min: minDate, max: maxDate });
              }

              queryBuilders.push(search);
            }

            // Call FreshBooks API
            const response = await fbClient.payments.list(
              input.accountId,
              queryBuilders
            );

            if (!response.ok) {
              throw response.error;
            }

            const data = response.data!;
            return {
              payments: (data as any).payments || [],
              pagination: {
                page: (data as any).pages?.page || 1,
                pages: (data as any).pages?.pages || 1,
                perPage: (data as any).pages?.perPage || (data as any).pages?.per_page || 30,
                total: (data as any).pages?.total || 0,
              },
            };
          }
        );

        logger.info('Payments listed successfully', {
          count: result.payments.length,
          total: result.pagination.total,
        });

        return result as z.infer<typeof PaymentListOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
