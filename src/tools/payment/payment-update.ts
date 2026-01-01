/**
 * payment_update Tool
 *
 * Update an existing payment in FreshBooks.
 */

import { z } from 'zod';
import { PaymentUpdateInputSchema, PaymentSingleOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for payment_update
 */
export const paymentUpdateTool = {
  name: 'payment_update',
  description: `Update an existing payment in FreshBooks.

WHEN TO USE:
- User needs to correct payment details
- User says "update payment", "fix payment", "change payment amount"
- User wants to update payment date, amount, type, or notes

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)
- paymentId: Payment to update

UPDATABLE FIELDS:
- amount: Correct the payment amount
- date: Adjust payment date
- type: Change payment method
- note: Update payment memo/reference

EXAMPLE PROMPTS:
- "Update payment #12345 to $600"
- "Change payment 67890 date to January 15"
- "Fix payment 555 - it was actually a check, not cash"
- "Update payment note to include check number"

RETURNS:
Updated payment record with modified fields.`,

  inputSchema: PaymentUpdateInputSchema,
  outputSchema: PaymentSingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof PaymentUpdateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof PaymentSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'payment_update',
      async (
        input: z.infer<typeof PaymentUpdateInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, paymentId, ...updates } = input;

        logger.debug('Updating payment', {
          accountId,
          paymentId,
          fields: Object.keys(updates),
        });

        // Build update object for API
        const payment: Record<string, unknown> = {};

        if (updates.amount !== undefined) payment.amount = updates.amount;
        if (updates.date !== undefined) payment.date = updates.date;
        if (updates.type !== undefined) payment.type = updates.type;
        if (updates.note !== undefined) payment.note = updates.note;

        const result = await client.executeWithRetry(
          'payment_update',
          async (fbClient) => {
            const response = await fbClient.payments.update(accountId, String(paymentId), payment as any);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { payment: { ... } }
        const updatedPayment = (result as { payment?: unknown }).payment ?? result;

        logger.info('Payment updated successfully', {
          paymentId,
        });

        return updatedPayment as z.infer<typeof PaymentSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
