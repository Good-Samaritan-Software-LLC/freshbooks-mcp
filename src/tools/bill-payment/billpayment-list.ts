/**
 * BillPayment List Tool
 *
 * List bill payments with pagination and optional filtering.
 */

import { z } from "zod";
import { BillPaymentListInputSchema, BillPaymentListOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { logger } from "../../utils/logger.js";

/**
 * Tool definition for billpayment_list
 */
export const billpaymentListTool = {
  name: "billpayment_list",
  description: `List bill payments from FreshBooks with optional filtering and pagination.

WHEN TO USE:
- User asks to "see bill payments", "list payments made", "show vendor payments"
- User wants to find payments for a specific bill
- User needs to track payment history

FILTERING OPTIONS:
- billId: Filter by specific bill
- startDate/endDate: Filter payments by date range

PAGINATION:
- Use page/perPage for large result sets
- Default: 30 results per page
- Maximum: 100 results per page

EXAMPLE PROMPTS:
- "Show me all bill payments"
- "List payments for bill 123"
- "Show payments made last month"
- "What payments did I make to vendors?"

RETURNS:
Array of bill payments with amounts, dates, payment types, and associated bills.
Includes pagination metadata for navigating large result sets.`,

  inputSchema: BillPaymentListInputSchema,
  outputSchema: BillPaymentListOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof BillPaymentListInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof BillPaymentListOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'billpayment_list',
      BillPaymentListInputSchema,
      async (
        input: z.infer<typeof BillPaymentListInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, page, perPage, ...filters } = input;

        logger.debug('Listing bill payments', {
          accountId,
          page,
          perPage,
          filters,
        });

        const result = await client.executeWithRetry(
          'billpayment_list',
          async (fbClient) => {
            // Dynamic import of query builders
            const { PaginationQueryBuilder } = await import(
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

            // NOTE: bill_payments has NO working server-side search filter
            // (live-confirmed #64, report F17): `bill_id`, `billid`, and
            // `paid_date` are all silently ignored by the API (it returns the full
            // set regardless), so we do not send them as no-op query params.
            // billId/startDate/endDate inputs are therefore not applied — matching
            // the same documented limitation on bill_vendors (F16). Client-side
            // filtering is intentionally avoided: it would only filter the current
            // page and mislead on paginated results.
            void filters;

            const response = await fbClient.billPayments.list(accountId, queryBuilders);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // Extract data. The SDK's list transform returns camelCase `billPayments`
        // (NOT snake `bill_payments`) — reading the wrong key made this list ALWAYS
        // return empty (live-confirmed during #64). Prefer billPayments, fall back
        // to bill_payments for safety.
        const billPayments = (result as any).billPayments || (result as any).bill_payments || [];
        const paginationData = (result as any).pages || {
          page: 1,
          pages: 1,
          total: billPayments.length,
          per_page: 30,
        };

        logger.info('Bill payments listed successfully', {
          count: billPayments.length,
          total: paginationData.total,
        });

        return {
          billPayments,
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
