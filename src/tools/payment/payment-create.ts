/**
 * payment_create Tool
 *
 * Record a new payment against an invoice in FreshBooks.
 */

import { z } from 'zod';
import { PaymentCreateInputSchema, PaymentSingleOutputSchema } from './schemas.js';
import { FreshBooksClientWrapper } from '../../client/index.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Tool definition for payment_create
 */
export const paymentCreateTool = {
  name: 'payment_create',
  description: `Record a new payment received against an invoice in FreshBooks.

WHEN TO USE:
- User received payment from a client
- User says "record payment", "log payment", "client paid invoice"
- User wants to mark an invoice as paid or partially paid

REQUIRED:
- accountId: FreshBooks account ID (get from auth_status if not specified)
- invoiceId: Invoice being paid (required)
- amount: Payment amount with currency code
- date: When payment was received (ISO 8601 format)

OPTIONAL BUT HELPFUL:
- type: Payment method (Check, Credit Card, PayPal, Cash, etc.)
- note: Payment reference number, check number, or other memo
- sendEmailReceipt: Whether to email receipt to client (default: false)

PAYMENT TYPES:
- Check, Credit Card, Cash, Bank Transfer, PayPal, Stripe, ACH, Wire Transfer, etc.

EXAMPLE PROMPTS:
- "Record a $500 payment for invoice #12345, paid by check today"
- "Client paid $1,200 via PayPal on Jan 15 for invoice 67890"
- "Log cash payment of $250 for invoice #555"

RETURNS:
Created payment record with ID, applied amount, and updated invoice balance.`,

  inputSchema: PaymentCreateInputSchema,
  outputSchema: PaymentSingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof PaymentCreateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof PaymentSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'payment_create',
      async (
        input: z.infer<typeof PaymentCreateInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, ...paymentData } = input;

        logger.debug('Creating payment', {
          accountId,
          invoiceId: paymentData.invoiceId,
          amount: paymentData.amount,
        });

        // Build payment object for API (convert camelCase to snake_case)
        const payment: Record<string, unknown> = {
          invoiceid: paymentData.invoiceId,
          amount: paymentData.amount,
          date: paymentData.date,
          type: paymentData.type || 'Cash',
        };

        // Add optional fields if provided
        if (paymentData.note !== undefined) payment.note = paymentData.note;
        if (paymentData.sendEmailReceipt !== undefined) {
          payment.send_email_receipt = paymentData.sendEmailReceipt;
        }

        const result = await client.executeWithRetry(
          'payment_create',
          async (fbClient) => {
            const response = await fbClient.payments.create(payment as any, accountId);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { payment: { ... } }
        const createdPayment = (result as { payment?: unknown }).payment ?? result;

        logger.info('Payment created successfully', {
          paymentId: (createdPayment as { id?: number }).id,
        });

        return createdPayment as z.infer<typeof PaymentSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
