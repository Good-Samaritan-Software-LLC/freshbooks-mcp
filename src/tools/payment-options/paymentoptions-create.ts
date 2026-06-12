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
- hasAchTransfer: Enable ACH/bank transfer
- hasPaypalSmartCheckout: Enable PayPal Smart Checkout
- allowPartialPayments: Allow customers to pay in installments
- gateway: Specify payment gateway to use

SUPPORTED GATEWAYS (live-verified; other values are rejected with a validation error):
- "stripe" - Stripe payment processing
- "paypal" - PayPal
- "fbpay" - FreshBooks Payments (WePay)
NOTE: the gateway must already be CONNECTED to the FreshBooks account, or the
API rejects with "The required gateway is not connected to this account".

EXAMPLE PROMPTS:
- "Enable credit card payments for invoice 12345"
- "Allow ACH transfers for invoice 678"
- "Set up PayPal for estimate 999"
- "Enable partial payments on invoice 111"

RETURNS:
Payment options: id, entityId, entityType (invoice/estimate), gateway,
hasAchTransfer (bool), hasCreditCard (bool), hasPaypalSmartCheckout (bool),
allowPartialPayments (bool), gatewayInfo: {gateway, gatewayId}.`,

  inputSchema: PaymentOptionsCreateInputSchema,
  outputSchema: PaymentOptionsSingleOutputSchema,

  async execute(
    input: z.infer<typeof PaymentOptionsCreateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof PaymentOptionsSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'paymentoptions_create',
      PaymentOptionsCreateInputSchema,
      async (input: z.infer<typeof PaymentOptionsCreateInputSchema>, _context: ToolContext) => {
        const {
          accountId,
          entityId,
          entityType,
          gateway,
          hasPaypalSmartCheckout,
          hasAchTransfer,
          hasCreditCard,
          allowPartialPayments,
        } = input;

        // Build the payload by EXPLICIT field mapping to the SDK request-model
        // property names — never a blanket `...spread` of the input. The spread
        // is exactly what let `gateway` (wants `gatewayName`) and
        // `hasPaypalSmartCheckout` (wants `hasPayPalSmartCheckout`, capital P)
        // get silently dropped (audit F4 + finding 9). Listing every field means
        // a name mismatch is a visible, reviewable line — not an invisible drop.
        // (Accepted gateway wire values: 'fbpay'/WePay, 'stripe', 'paypal'.)
        const paymentOptionsData: Record<string, unknown> = {
          entityId,
          entityType,
        };
        if (gateway !== undefined) paymentOptionsData.gatewayName = gateway;
        if (hasPaypalSmartCheckout !== undefined) paymentOptionsData.hasPayPalSmartCheckout = hasPaypalSmartCheckout;
        if (hasAchTransfer !== undefined) paymentOptionsData.hasAchTransfer = hasAchTransfer;
        if (hasCreditCard !== undefined) paymentOptionsData.hasCreditCard = hasCreditCard;
        if (allowPartialPayments !== undefined) paymentOptionsData.allowPartialPayments = allowPartialPayments;

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
