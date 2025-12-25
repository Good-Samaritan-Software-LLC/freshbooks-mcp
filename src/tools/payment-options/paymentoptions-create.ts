/**
 * PaymentOptions Create Tool
 *
 * Configure payment options for an invoice or estimate.
 */

import { z } from "zod";
import { PaymentOptionsCreateInputSchema, PaymentOptionsSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for paymentoptions_create
 */
export const paymentOptionsCreateTool = {
  name: "paymentoptions_create",
  description: `Configure payment options for an invoice or estimate.

WHEN TO USE:
- User wants to enable specific payment methods for an invoice
- User says "enable credit card payments", "allow ACH for this invoice"
- Need to set up payment gateway configuration

REQUIRED INFO:
- Entity ID (invoice or estimate ID)
- Entity type ("invoice" or "estimate")
- Account ID

OPTIONAL PAYMENT SETTINGS:
- hasCreditCard: Enable credit card payments
- hasAch: Enable ACH/bank transfer
- hasPaypalSmartCheckout: Enable PayPal Smart Checkout
- allowPartialPayments: Allow customers to pay in installments
- gateway: Specify payment gateway to use

COMMON GATEWAYS:
- "stripe" - Stripe payment processing
- "paypal" - PayPal
- "square" - Square
- "authorize_net" - Authorize.Net
- "wepay" - WePay

EXAMPLE PROMPTS:
- "Enable credit card payments for invoice 12345"
- "Allow ACH transfers for invoice 678"
- "Set up PayPal for estimate 999"
- "Enable partial payments on invoice 111"

RETURNS:
Created payment options configuration for the invoice or estimate.`,

  inputSchema: PaymentOptionsCreateInputSchema,
  outputSchema: PaymentOptionsSingleOutputSchema,

  async execute(
    input: z.infer<typeof PaymentOptionsCreateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof PaymentOptionsSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'paymentoptions_create',
      async (input: z.infer<typeof PaymentOptionsCreateInputSchema>, _context: ToolContext) => {
        const { accountId, entityId, entityType, ...options } = input;

        // Prepare payment options data
        const paymentOptionsData = {
          entityId,
          entityType,
          ...options,
        } as any;

        const result = await client.executeWithRetry('paymentoptions_create', async (fbClient) => {
          const response = await fbClient.paymentOptions.create(accountId, entityId.toString(), paymentOptionsData);

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        // Extract payment options data
        return (result as any).paymentOptions || (result as any);
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
