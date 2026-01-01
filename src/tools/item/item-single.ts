/**
 * Item Single Tool
 *
 * Retrieve a single item by ID.
 */

import { z } from "zod";
import { ItemSingleInputSchema, ItemSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { logger } from "../../utils/logger.js";

/**
 * Tool definition for item_single
 */
export const itemSingleTool = {
  name: "item_single",
  description: `Retrieve a single reusable item by ID from FreshBooks.

WHEN TO USE:
- User asks for details about a specific item
- User references an item ID or SKU
- User wants to see full item information before adding to invoice

REQUIRED:
- accountId: FreshBooks account ID
- itemId: The specific item ID to retrieve

EXAMPLE PROMPTS:
- "Show me item 12345"
- "Get details for that product"
- "What's the rate for item #PROD-001?"

RETURNS:
Complete item details including name, description, rate, type, inventory,
SKU, and tax settings.`,

  inputSchema: ItemSingleInputSchema,
  outputSchema: ItemSingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof ItemSingleInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ItemSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'item_single',
      async (
        input: z.infer<typeof ItemSingleInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, itemId } = input;

        logger.debug('Retrieving item', {
          accountId,
          itemId,
        });

        const result = await client.executeWithRetry(
          'item_single',
          async (fbClient) => {
            const response = await fbClient.items.single(accountId, String(itemId));

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { item: { ... } }
        const item = (result as { item?: unknown }).item ?? result;

        logger.info('Item retrieved successfully', {
          itemId,
        });

        return item as z.infer<typeof ItemSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
