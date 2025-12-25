/**
 * Item Update Tool
 *
 * Update an existing reusable invoice line item in FreshBooks.
 */

import { z } from "zod";
import { ItemUpdateInputSchema, ItemSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { logger } from "../../utils/logger.js";

/**
 * Tool definition for item_update
 */
export const itemUpdateTool = {
  name: "item_update",
  description: `Update an existing reusable invoice line item in FreshBooks.

WHEN TO USE:
- User wants to update item pricing or details
- Item description or rate needs to be changed
- Inventory quantities need updating

REQUIRED:
- accountId: FreshBooks account ID
- itemId: The item ID to update

OPTIONAL (at least one should be provided):
- name: Updated item name/description
- description: Updated detailed description
- type: Updated item type
- rate: Updated unit price
- quantity: Updated default quantity
- taxable: Updated taxable status
- tax1, tax2: Updated tax names
- inventory: Updated inventory quantity
- sku: Updated SKU

EXAMPLE PROMPTS:
- "Update item 123 to $175/hour"
- "Change the description for item 'Consulting'"
- "Increase inventory for item #PROD-001 to 50 units"
- "Update SKU for item 456"

RETURNS:
Updated item with all current details.`,

  inputSchema: ItemUpdateInputSchema,
  outputSchema: ItemSingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof ItemUpdateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ItemSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'item_update',
      async (
        input: z.infer<typeof ItemUpdateInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, itemId, ...updateData } = input;

        logger.debug('Updating item', {
          accountId,
          itemId,
          fields: Object.keys(updateData),
        });

        const result = await client.executeWithRetry(
          'item_update',
          async (fbClient) => {
            const response = await fbClient.items.update(
              accountId,
              String(itemId),
              updateData as any
            );

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { item: { ... } }
        const updatedItem = (result as { item?: unknown }).item ?? result;

        logger.info('Item updated successfully', {
          itemId,
        });

        return updatedItem as z.infer<typeof ItemSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
