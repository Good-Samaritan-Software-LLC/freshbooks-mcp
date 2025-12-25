/**
 * payment_delete Tool
 *
 * Delete a payment from FreshBooks.
 */

import { z } from 'zod';
import { PaymentDeleteInputSchema, PaymentDeleteOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for payment_delete
 */
export const paymentDeleteTool = {
  name: 'payment_delete',
  description: `Delete a payment from FreshBooks.

WHEN TO USE:
- User recorded payment in error
- User says "delete payment", "remove payment", "cancel payment"
- User needs to undo a payment entry

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)
- paymentId: Payment to delete

IMPORTANT NOTES:
- Deleting a payment will adjust the invoice balance back
- This cannot be undone - use with caution
- Consider updating instead of deleting if just correcting details

EXAMPLE PROMPTS:
- "Delete payment #12345"
- "Remove payment 67890 - it was entered twice"
- "Cancel payment ID 555"

RETURNS:
Confirmation of deletion with the deleted payment ID.`,

  inputSchema: PaymentDeleteInputSchema,
  outputSchema: PaymentDeleteOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof PaymentDeleteInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof PaymentDeleteOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'payment_delete',
      async (
        input: z.infer<typeof PaymentDeleteInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, paymentId } = input;

        logger.debug('Deleting payment', {
          accountId,
          paymentId,
        });

        await client.executeWithRetry(
          'payment_delete',
          async (fbClient) => {
            const response = await fbClient.payments.delete(accountId, String(paymentId));

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        logger.info('Payment deleted successfully', {
          paymentId,
        });

        return {
          success: true,
          paymentId,
        };
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
