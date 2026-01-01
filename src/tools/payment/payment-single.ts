/**
 * payment_single Tool
 *
 * Retrieve a single payment by ID.
 */

import { z } from 'zod';
import { PaymentSingleInputSchema, PaymentSingleOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for payment_single
 */
export const paymentSingleTool = {
  name: 'payment_single',
  description: `Retrieve a single payment by ID from FreshBooks.

WHEN TO USE:
- User asks for details about a specific payment
- User provides a payment ID and wants full information
- User needs to verify payment details before updating

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)
- paymentId: The payment identifier

EXAMPLE PROMPTS:
- "Show me payment #12345"
- "Get details for payment 67890"
- "What are the details of payment ID 555?"

RETURNS:
Complete payment record including amount, date, payment type, invoice ID,
client ID, notes, and all other payment properties.`,

  inputSchema: PaymentSingleInputSchema,
  outputSchema: PaymentSingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof PaymentSingleInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof PaymentSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'payment_single',
      async (
        input: z.infer<typeof PaymentSingleInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, paymentId } = input;

        logger.debug('Retrieving payment', {
          accountId,
          paymentId,
        });

        const result = await client.executeWithRetry(
          'payment_single',
          async (fbClient) => {
            const response = await fbClient.payments.single(accountId, String(paymentId));

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { payment: { ... } }
        const payment = (result as { payment?: unknown }).payment ?? result;

        logger.info('Payment retrieved successfully', {
          paymentId,
        });

        return payment as z.infer<typeof PaymentSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
