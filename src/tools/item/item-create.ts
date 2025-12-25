/**
 * Item Create Tool
 *
 * Create a new reusable invoice line item in FreshBooks.
 */

import { z } from "zod";
import { ItemCreateInputSchema, ItemSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";
import { logger } from "../../utils/logger.js";

/**
 * Tool definition for item_create
 */
export const itemCreateTool = {
  name: "item_create",
  description: `Create a new reusable invoice line item in FreshBooks.

WHEN TO USE:
- User says "create an item", "add a product", "new service item"
- User wants to set up a reusable item for invoices
- User mentions adding a billable product or service

REQUIRED INFO:
- accountId: FreshBooks account ID
- name: Item name/description

OPTIONAL BUT HELPFUL:
- description: Detailed description for invoices
- type: Item type (product, service, discount) - defaults to 'service'
- rate: Unit price with currency code
- quantity: Default quantity (for products)
- taxable: Whether item is taxable (defaults to true)
- tax1, tax2: Tax names to apply
- inventory: Available quantity for products
- sku: Stock keeping unit for tracking

EXAMPLE PROMPTS:
- "Create a service item called 'Consulting' at $150/hour"
- "Add a product 'Widget' with SKU WDG-001 priced at $25"
- "New item: Monthly Hosting at $99.99"

RETURNS:
Created item with ID and all details for use in invoices.`,

  inputSchema: ItemCreateInputSchema,
  outputSchema: ItemSingleOutputSchema,

  /**
   * Execute the tool
   */
  async execute(
    input: z.infer<typeof ItemCreateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ItemSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'item_create',
      async (
        input: z.infer<typeof ItemCreateInputSchema>,
        _context: ToolContext
      ) => {
        const { accountId, ...itemData } = input;

        logger.debug('Creating item', {
          accountId,
          name: itemData.name,
        });

        const result = await client.executeWithRetry(
          'item_create',
          async (fbClient) => {
            const response = await fbClient.items.create(itemData as any, accountId);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { item: { ... } }
        const createdItem = (result as { item?: unknown }).item ?? result;

        logger.info('Item created successfully', {
          itemId: (createdItem as { id?: number }).id,
        });

        return createdItem as z.infer<typeof ItemSingleOutputSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
