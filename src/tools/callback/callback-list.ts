/**
 * Callback List Tool
 *
 * List webhooks/callbacks with pagination.
 */

import { z } from "zod";
import { CallbackListInputSchema, CallbackListOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for callback_list
 */
export const callbackListTool = {
  name: "callback_list",
  description: `List webhooks/callbacks from FreshBooks.

WHEN TO USE:
- User asks to "see webhooks", "list callbacks", "show webhook subscriptions"
- User wants to check what events they're subscribed to
- User needs to verify webhook setup

WHAT IT RETURNS:
Each callback includes:
- Event type being monitored (e.g., invoice.create, payment.create)
- Webhook endpoint URL
- Verification status
- Creation/update timestamps

PAGINATION:
- Use page/perPage for large result sets
- Default: 30 results per page
- Maximum: 100 results per page

EXAMPLE PROMPTS:
- "Show me all my webhooks"
- "List webhook subscriptions"
- "What events am I listening for?"

RETURNS:
Array of webhook configurations with their verification status and event types.`,

  inputSchema: CallbackListInputSchema,
  outputSchema: CallbackListOutputSchema,

  async execute(
    input: z.infer<typeof CallbackListInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof CallbackListOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'callback_list',
      async (input: z.infer<typeof CallbackListInputSchema>, _context: ToolContext) => {
        const { accountId, page, perPage } = input;

        const result = await client.executeWithRetry('callback_list', async (fbClient) => {
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

          const response = await fbClient.callbacks.list(accountId, queryBuilders);

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        // Extract data
        const callbacks = (result as any).callbacks || [];
        const paginationData = (result as any).pages || {
          page: 1,
          pages: 1,
          total: callbacks.length,
          per_page: 30,
        };

        return {
          callbacks,
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
