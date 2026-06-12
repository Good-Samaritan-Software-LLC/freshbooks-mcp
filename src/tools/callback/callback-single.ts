/**
 * Callback Single Tool
 *
 * Get a single webhook/callback by ID.
 */

import { z } from "zod";
import { CallbackSingleInputSchema, CallbackSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for callback_single
 */
export const callbackSingleTool = {
  name: "callback_single",
  description: `Get a single webhook/callback by ID from FreshBooks.

WHEN TO USE:
- User asks for details about a specific webhook
- User wants to check verification status of a webhook
- User needs to see the configuration of a particular callback

REQUIRED INFO:
- Callback ID (from callback_list)
- Account ID

EXAMPLE PROMPTS:
- "Show me webhook 123"
- "Get details for callback 456"
- "Is webhook 789 verified?"

RETURNS:
Callback object: id, event, uri, verified (bool), createdAt, updatedAt.`,

  inputSchema: CallbackSingleInputSchema,
  outputSchema: CallbackSingleOutputSchema,

  async execute(
    input: z.infer<typeof CallbackSingleInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof CallbackSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'callback_single',
      CallbackSingleInputSchema,
      async (input: z.infer<typeof CallbackSingleInputSchema>, _context: ToolContext) => {
        const { accountId, callbackId } = input;

        const result = await client.executeWithRetry('callback_single', async (fbClient) => {
          const response = await fbClient.callbacks.single(accountId, String(callbackId));

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
