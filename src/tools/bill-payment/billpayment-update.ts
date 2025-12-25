/**
 * BillPayment Update Tool
 *
 * Update an existing bill payment in FreshBooks.
 */

import { z } from "zod";
import { BillPaymentUpdateInputSchema, BillPaymentSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { logger } from "../../utils/logger.js";

/**
 * Tool definition for billpayment_update
 */
export const billpaymentUpdateTool = {
  name: "billpayment_update",
  description: `Update an existing bill payment in FreshBooks.

WHEN TO USE:
- User wants to correct payment details
- Payment amount or date needs to be changed
- Payment type or notes need updating

REQUIRED:
- accountId: FreshBooks account ID
- billPaymentId: The payment ID to update

OPTIONAL (at least one should be provided):
- amount: Corrected payment amount
- paymentType: Updated payment type
- paidDate: Corrected payment date
- note: Updated or additional notes

EXAMPLE PROMPTS:
- "Update payment 123 to $600"
- "Change the payment date for bill payment 456"
- "Correct payment type to bank_transfer for payment 789"

RETURNS:
Updated payment with all current details.`,

  inputSchema: BillPaymentUpdateInputSchema,
  outputSchema: BillPaymentSingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof BillPaymentUpdateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof BillPaymentSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'billpayment_update',
      async (
        input: z.infer<typeof BillPaymentUpdateInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, billPaymentId, ...updateData } = input;

        logger.debug('Updating bill payment', {
          accountId,
          billPaymentId,
        });

        const result = await client.executeWithRetry(
          'billpayment_update',
          async (fbClient) => {
            const response = await fbClient.billPayments.update(updateData as any, accountId, billPaymentId);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { bill_payment: { ... } }
        const updatedPayment = (result as { bill_payment?: unknown }).bill_payment ?? result;

        logger.info('Bill payment updated successfully', {
          billPaymentId,
        });

        return updatedPayment as z.infer<typeof BillPaymentSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
