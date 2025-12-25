/**
 * Base tool utilities and common patterns
 *
 * Provides shared schemas, helper functions, and base patterns
 * for creating consistent MCP tools across all FreshBooks entities.
 */

import { z } from 'zod';
import type { Client } from '@freshbooks/api';
import {
  PaginationQueryBuilder,
  SearchQueryBuilder,
  IncludesQueryBuilder,
  SortQueryBuilder,
  joinQueries,
  type QueryBuilderType,
} from '@freshbooks/api/dist/models/builders/index.js';

/**
 * Standard account ID schema (required for all FreshBooks operations)
 */
export const AccountIdSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
});

/**
 * Business ID schema (used for services and some other resources)
 */
export const BusinessIdSchema = z.object({
  businessId: z.number().int().positive().describe('FreshBooks business ID'),
});

/**
 * Standard pagination schema for list operations
 */
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1).describe('Page number (1-indexed)'),
  perPage: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(30)
    .describe('Number of results per page (max 100)'),
});

/**
 * Standard pagination metadata in responses
 */
export const PaginationMetadataSchema = z.object({
  page: z.number(),
  pages: z.number(),
  perPage: z.number(),
  total: z.number(),
});

/**
 * Common visibility state enum
 */
export const VisStateSchema = z
  .union([z.literal(0), z.literal(1), z.literal(2)])
  .describe('Visibility state: 0=active, 1=deleted, 2=archived');

/**
 * Money type (amount + currency code)
 */
export const MoneySchema = z.object({
  amount: z.string().describe('Decimal amount as string'),
  code: z.string().describe('Currency code (e.g., USD)'),
});

/**
 * Tool configuration for createTool helper
 */
export interface ToolConfig<TInput, TOutput> {
  name: string;
  description: string;
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  handler: (input: TInput, client: Client) => Promise<TOutput>;
}

/**
 * Create a standardized MCP tool with validation and error handling
 *
 * @param config Tool configuration
 * @returns Tool object with name, schema, and handler
 */
export function createTool<TInput, TOutput>(config: ToolConfig<TInput, TOutput>) {
  return {
    name: config.name,
    schema: {
      description: config.description,
      input: config.inputSchema,
      output: config.outputSchema,
    },
    handler: config.handler,
  };
}

/**
 * Export query builders for use in tools
 */
export {
  PaginationQueryBuilder,
  SearchQueryBuilder,
  IncludesQueryBuilder,
  SortQueryBuilder,
  joinQueries,
  type QueryBuilderType,
};
