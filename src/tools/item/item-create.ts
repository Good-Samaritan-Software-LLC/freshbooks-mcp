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
- unitCost: Unit price as { amount, code } (e.g. { amount: "150.00", code: "USD" })
- qty: Default quantity as a decimal string (for products)
- tax1, tax2: Integer tax ids to apply (this is how taxability is set — items
  have no separate "type" or "taxable" field)
- inventory: Available quantity for products
- sku: Stock keeping unit for tracking

EXAMPLE PROMPTS:
- "Create a service item called 'Consulting' at $150/hour"
- "Add a product 'Widget' with SKU WDG-001 priced at $25"
- "New item: Monthly Hosting at $99.99"

RETURNS:
Created item: id, name, description, unitCost: {amount, code},
qty, tax1, tax2, inventory, sku, accountingSystemId, visState, createdAt, updatedAt.`,

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
      ItemCreateInputSchema,
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
            // SDK signature is items.create(accountId, data) — accountId FIRST.
            const response = await fbClient.items.create(accountId, itemData as any);

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
