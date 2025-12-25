/**
 * BillPayment Create Tool
 *
 * Create a new bill payment in FreshBooks.
 */

import { z } from "zod";
import { BillPaymentCreateInputSchema, BillPaymentSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { logger } from "../../utils/logger.js";

/**
 * Tool definition for billpayment_create
 */
export const billpaymentCreateTool = {
  name: "billpayment_create",
  description: `Record a new bill payment in FreshBooks.

WHEN TO USE:
- User says "record a payment", "pay a bill", "log vendor payment"
- User mentions paying a vendor or supplier
- User needs to track bill payments

REQUIRED INFO:
- accountId: FreshBooks account ID
- billId: The bill being paid
- amount: Payment amount with currency code
- paymentType: How payment was made (check, credit, cash, bank_transfer, debit, other)
- paidDate: When payment was made (ISO 8601 format)

OPTIONAL:
- note: Additional details about the payment

EXAMPLE PROMPTS:
- "Record a payment of $500 for bill 123"
- "I paid bill #B-042 by check today for $1,250"
- "Log a cash payment of $200 to vendor bill 456"

RETURNS:
Created payment record with ID and all details for tracking.`,

  inputSchema: BillPaymentCreateInputSchema,
  outputSchema: BillPaymentSingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof BillPaymentCreateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof BillPaymentSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'billpayment_create',
      async (
        input: z.infer<typeof BillPaymentCreateInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, ...paymentData } = input;

        logger.debug('Creating bill payment', {
          accountId,
          billId: paymentData.billId,
        });

        const result = await client.executeWithRetry(
          'billpayment_create',
          async (fbClient) => {
            const response = await fbClient.billPayments.create(paymentData as any, accountId);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { bill_payment: { ... } }
        const createdPayment = (result as { bill_payment?: unknown }).bill_payment ?? result;

        logger.info('Bill payment created successfully', {
          billPaymentId: (createdPayment as { id?: number }).id,
        });

        return createdPayment as z.infer<typeof BillPaymentSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
