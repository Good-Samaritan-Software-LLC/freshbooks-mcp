/**
 * client_single Tool
 *
 * Retrieve a single client by ID.
 */

import { z } from 'zod';
import { ClientSingleInputSchema, ClientSingleOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for client_single
 */
export const clientSingleTool = {
  name: 'client_single',
  description: `Retrieve a single client's full details from FreshBooks.

WHEN TO USE:
- User asks for details about a specific client
- User says "show me client #123", "get client info for ID 456"
- Need complete client information including addresses and preferences
- Looking up client details before creating invoice or project

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)
- clientId: The FreshBooks client ID (numeric)

RETURNS:
Complete client record including:
- Contact information (name, email, phones)
- Primary and secondary addresses
- Billing preferences and currency settings
- VAT/tax information
- Retainer status
- Last update timestamp

EXAMPLES:
- "Show me details for client 12345"
- "Get full information for client ID 789"
- "What's the address for client 456?"`,

  inputSchema: ClientSingleInputSchema,
  outputSchema: ClientSingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof ClientSingleInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ClientSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'client_single',
      async (
        input: z.infer<typeof ClientSingleInputSchema>,
        _context: ToolContext
      ) => {
        logger.debug('Getting client', {
          accountId: input.accountId,
          clientId: input.clientId,
        });

        const result = await client.executeWithRetry(
          'client_single',
          async (fbClient) => {
            const response = await fbClient.clients.single(
              input.accountId,
              String(input.clientId)
            );

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { client: { ... } }
        const clientData = (result as { client?: unknown }).client ?? result;

        logger.info('Client retrieved successfully', {
          clientId: input.clientId,
        });

        return clientData as z.infer<typeof ClientSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
