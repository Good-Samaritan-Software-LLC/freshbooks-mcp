/**
 * Callback Create Tool
 *
 * Register a new webhook/callback for event notifications.
 */

import { z } from "zod";
import { CallbackCreateInputSchema, CallbackSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for callback_create
 */
export const callbackCreateTool = {
  name: "callback_create",
  description: `Register a new webhook/callback in FreshBooks.

WHEN TO USE:
- User wants to receive notifications for FreshBooks events
- User says "create a webhook", "set up event notification", "register callback"
- User wants to be notified when invoices are created, payments received, etc.

REQUIRED INFO:
- Event type (e.g., "invoice.create", "payment.create", "time_entry.create")
- Webhook endpoint URL (must be HTTPS and publicly accessible)
- Account ID

COMMON EVENT TYPES:
- invoice.create, invoice.update, invoice.delete
- payment.create, payment.update, payment.delete
- time_entry.create, time_entry.update, time_entry.delete
- client.create, client.update
- project.create, project.update

IMPORTANT NOTES:
- Webhook URL must be HTTPS
- FreshBooks will send a verification request to your URL
- You must call callback_verify with the verification code to activate
- Until verified, no events will be sent

EXAMPLE PROMPTS:
- "Create a webhook for new invoices at https://myapp.com/webhooks"
- "Register callback for payment notifications"
- "Set up webhook to track time entry changes"

RETURNS:
Created webhook with verification status (unverified initially).
Use callback_verify to complete activation.`,

  inputSchema: CallbackCreateInputSchema,
  outputSchema: CallbackSingleOutputSchema,

  async execute(
    input: z.infer<typeof CallbackCreateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof CallbackSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'callback_create',
      async (input: z.infer<typeof CallbackCreateInputSchema>, _context: ToolContext) => {
        const { accountId, event, uri } = input;

        // Validate HTTPS
        if (!uri.startsWith('https://')) {
          throw ErrorHandler.createValidationError(
            'Webhook URI must use HTTPS protocol for security',
            { tool: 'callback_create', accountId }
          );
        }

        // Prepare callback data
        const callbackData = {
          event,
          uri,
        };

        const result = await client.executeWithRetry('callback_create', async (fbClient) => {
          const response = await fbClient.callbacks.create(callbackData as any, accountId);

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
