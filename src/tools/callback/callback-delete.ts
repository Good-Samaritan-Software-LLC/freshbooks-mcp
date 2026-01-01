/**
 * Callback Delete Tool
 *
 * Delete/unregister a webhook/callback.
 */

import { z } from "zod";
import { CallbackDeleteInputSchema, CallbackDeleteOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for callback_delete
 */
export const callbackDeleteTool = {
  name: "callback_delete",
  description: `Delete/unregister a webhook/callback from FreshBooks.

WHEN TO USE:
- User wants to stop receiving webhook notifications
- User says "delete webhook", "remove callback", "unregister webhook"
- User needs to clean up unused webhook subscriptions

REQUIRED INFO:
- Callback ID to delete
- Account ID

WHAT HAPPENS:
- Webhook is permanently deleted
- No more events will be sent to the endpoint
- Cannot be undone (must recreate to re-enable)

EXAMPLE PROMPTS:
- "Delete webhook 123"
- "Remove callback 456"
- "Unregister the webhook for invoices"
- "Stop sending payment notifications"

RETURNS:
Confirmation that the webhook was deleted successfully.`,

  inputSchema: CallbackDeleteInputSchema,
  outputSchema: CallbackDeleteOutputSchema,

  async execute(
    input: z.infer<typeof CallbackDeleteInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof CallbackDeleteOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'callback_delete',
      async (input: z.infer<typeof CallbackDeleteInputSchema>, _context: ToolContext) => {
        const { accountId, callbackId } = input;

        await client.executeWithRetry('callback_delete', async (fbClient) => {
          const response = await fbClient.callbacks.delete(accountId, String(callbackId));

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        return {
          success: true,
          callbackId,
        };
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
