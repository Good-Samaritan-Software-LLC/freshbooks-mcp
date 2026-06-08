/**
 * Zod schemas for Item entity
 *
 * Item management schemas for FreshBooks API
 */

import { z } from 'zod';
import { MoneySchema, VisStateSchema } from '../base-tool.js';

/**
 * Full Item schema with all properties.
 *
 * No `type` / `taxable`: the FreshBooks item object has neither field
 * (live-verified 2026-06-07 — the wire item exposes name, description,
 * unit_cost, qty, sku, tax1, tax2, tax_rule_code, inventory, vis_state, …).
 * Taxability is controlled by tax1/tax2 (tax ids). audit finding 11.
 */
export const ItemSchema = z.object({
  id: z.number().describe('Unique item identifier'),
  name: z.string().describe('Item name/description'),
  description: z.string().nullable().describe('Detailed item description'),
  unitCost: MoneySchema.nullable().describe('Unit price (Money object). Wire field: unit_cost'),
  qty: z.string().optional().describe('Default quantity (decimal string). Wire field: qty'),
  tax1: z.string().nullable().describe('Primary tax id (the SDK returns it as a string)'),
  tax2: z.string().nullable().describe('Secondary tax id (the SDK returns it as a string)'),
  inventory: z.number().nullable().describe('Inventory quantity available'),
  sku: z.string().nullable().describe('Stock keeping unit (SKU)'),
  accountingSystemId: z.string().nullable().describe('Reference to accounting system'),
  visState: VisStateSchema.optional().describe('Visibility state'),
  createdAt: z.string().datetime().describe('Creation timestamp (ISO 8601)'),
  updatedAt: z.string().datetime().describe('Last update timestamp (ISO 8601)'),
});

/**
 * Input schema for creating an item
 */
export const ItemCreateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  name: z.string().min(1).describe('Item name/description (required)'),
  description: z.string().optional().describe('Detailed item description'),
  // No `type` / `taxable`: the item object has neither field (live-verified
  // 2026-06-07, audit finding 11). Taxability is set via tax1/tax2 tax ids.
  unitCost: z.object({
    amount: z.string().describe('Unit price'),
    code: z.string().describe('Currency code (e.g., USD)'),
  }).optional().describe('Unit price as a Money object. Maps to the SDK/wire field unit_cost (a field named "rate" is silently dropped).'),
  qty: z.string().optional().describe('Default quantity as a decimal string (wire field qty)'),
  tax1: z.number().int().optional().describe('Primary tax id (integer tax id, not a name)'),
  tax2: z.number().int().optional().describe('Secondary tax id (integer tax id, not a name)'),
  inventory: z.number().min(0).optional().describe('Inventory quantity available'),
  sku: z.string().optional().describe('Stock keeping unit (SKU)'),
});

/**
 * Input schema for updating an item
 */
export const ItemUpdateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  itemId: z.number().describe('Item ID to update'),
  name: z.string().min(1).optional().describe('Item name/description'),
  description: z.string().optional().describe('Detailed item description'),
  // No `type` / `taxable` — see the create-schema note (item object has neither).
  unitCost: z.object({
    amount: z.string().describe('Unit price'),
    code: z.string().describe('Currency code (e.g., USD)'),
  }).optional().describe('Unit price as a Money object. Maps to the SDK/wire field unit_cost (a field named "rate" is silently dropped).'),
  qty: z.string().optional().describe('Default quantity as a decimal string (wire field qty)'),
  tax1: z.number().int().optional().describe('Primary tax id (integer tax id, not a name)'),
  tax2: z.number().int().optional().describe('Secondary tax id (integer tax id, not a name)'),
  inventory: z.number().min(0).optional().describe('Inventory quantity available'),
  sku: z.string().optional().describe('Stock keeping unit (SKU)'),
});

/**
 * Input schema for listing items
 */
export const ItemListInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  page: z.number().int().min(1).default(1).optional().describe('Page number (1-indexed)'),
  perPage: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(30)
    .optional()
    .describe('Number of results per page (max 100)'),
  name: z.string().optional().describe('Filter by item name (partial match)'),
  // No `type` filter: items have no type field, so the server ignores it
  // (audit finding 11).
  sku: z.string().optional().describe('Filter by SKU'),
});

/**
 * Input schema for getting a single item
 */
export const ItemSingleInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  itemId: z.number().describe('Item ID to retrieve'),
});

/**
 * Pagination metadata schema
 */
export const PaginationMetadataSchema = z.object({
  page: z.number().describe('Current page number'),
  pages: z.number().describe('Total number of pages'),
  perPage: z.number().describe('Results per page'),
  total: z.number().describe('Total number of results'),
});

/**
 * Output schema for item list
 */
export const ItemListOutputSchema = z.object({
  items: z.array(ItemSchema).describe('Array of items'),
  pagination: PaginationMetadataSchema.describe('Pagination information'),
});

/**
 * Output schema for single item operations
 */
export const ItemSingleOutputSchema = ItemSchema;
