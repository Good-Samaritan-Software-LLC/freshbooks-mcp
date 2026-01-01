/**
 * client_delete Tool
 *
 * Delete a client from FreshBooks.
 */

import { z } from 'zod';
import { ClientDeleteInputSchema, ClientDeleteOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for client_delete
 */
export const clientDeleteTool = {
  name: 'client_delete',
  description: `Delete a client from FreshBooks.

WHEN TO USE:
- User wants to remove a client
- User says "delete client", "remove customer", "delete client ID 123"
- Cleaning up duplicate or test client records

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)
- clientId: The client ID to delete (numeric)

IMPORTANT NOTES:
- This performs a soft delete (sets visState to deleted)
- Client data is preserved for historical records
- Associated invoices and time entries remain intact
- Deleted clients can potentially be restored by updating visState

ALTERNATIVE:
Consider archiving instead of deleting:
- Use client_update with visState=2 (archived)
- Client is hidden but fully recoverable

RETURNS:
Confirmation with success status and deleted client ID.

EXAMPLES:
- "Delete client 123"
- "Remove client ID 456"
- "Delete the test client"`,

  inputSchema: ClientDeleteInputSchema,
  outputSchema: ClientDeleteOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof ClientDeleteInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ClientDeleteOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'client_delete',
      async (
        input: z.infer<typeof ClientDeleteInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, clientId } = input;

        logger.debug('Deleting client', {
          accountId,
          clientId,
        });

        await client.executeWithRetry(
          'client_delete',
          async (fbClient) => {
            const response = await fbClient.clients.delete(accountId, String(clientId));

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        logger.info('Client deleted successfully', {
          clientId,
        });

        return {
          success: true,
          clientId,
        };
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
