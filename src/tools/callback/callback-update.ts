/**
 * Callback Update Tool
 *
 * Update an existing webhook/callback configuration.
 */

import { z } from "zod";
import { CallbackUpdateInputSchema, CallbackSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for callback_update
 */
export const callbackUpdateTool = {
  name: "callback_update",
  description: `Update an existing webhook/callback in FreshBooks.

WHEN TO USE:
- User wants to change the event type for a webhook
- User needs to update the webhook endpoint URL
- User says "update webhook", "change callback URL"

REQUIRED INFO:
- Callback ID to update
- Account ID

OPTIONAL UPDATES:
- event: Change the event type to listen for
- uri: Update the webhook endpoint URL

IMPORTANT NOTES:
- If you change the URI, the webhook will need to be reverified
- Changing the event type does not require reverification
- Webhook URL must be HTTPS

EXAMPLE PROMPTS:
- "Update webhook 123 to use new URL https://newapp.com/webhooks"
- "Change callback 456 to listen for payment.create instead"
- "Update the endpoint for webhook 789"

RETURNS:
Updated webhook configuration with current verification status.`,

  inputSchema: CallbackUpdateInputSchema,
  outputSchema: CallbackSingleOutputSchema,

  async execute(
    input: z.infer<typeof CallbackUpdateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof CallbackSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'callback_update',
      async (input: z.infer<typeof CallbackUpdateInputSchema>, _context: ToolContext) => {
        const { accountId, callbackId, ...updates } = input;

        // Validate HTTPS if URI is being updated
        if (updates.uri && !updates.uri.startsWith('https://')) {
          throw ErrorHandler.createValidationError(
            'Webhook URI must use HTTPS protocol for security',
            { tool: 'callback_update', accountId, entityId: callbackId }
          );
        }

        const result = await client.executeWithRetry('callback_update', async (fbClient) => {
          const response = await fbClient.callbacks.update(updates as any, accountId, String(callbackId));

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        // Extract callback data
        return (result as any).callback;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
