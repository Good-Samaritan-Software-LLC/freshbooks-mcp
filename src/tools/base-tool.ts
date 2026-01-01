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

/**
 * Sort direction enum - used for list operations
 */
export const SortDirectionSchema = z.enum(['asc', 'desc']).describe(
  'Sort direction: asc (ascending, A-Z, oldest first) or desc (descending, Z-A, newest first)'
);

/**
 * Generic sort schema factory - creates entity-specific sort schemas
 */
export function createSortSchema<T extends string>(
  sortableFields: readonly T[],
  fieldDescriptions?: Record<T, string>
) {
  const fieldEnum = z.enum(sortableFields as [T, ...T[]]);

  return z.object({
    sortBy: fieldEnum
      .optional()
      .describe(
        `Field to sort by. Options: ${sortableFields.join(', ')}` +
        (fieldDescriptions
          ? '. ' + Object.entries(fieldDescriptions).map(([k, v]) => `${k}: ${v}`).join('; ')
          : '')
      ),
    sortOrder: SortDirectionSchema
      .default('desc')
      .optional()
      .describe('Sort order (default: desc for newest first)'),
  });
}

/**
 * Generic includes schema factory - creates entity-specific includes schemas
 */
export function createIncludesSchema<T extends string>(
  includeOptions: readonly T[],
  includeDescriptions: Record<T, string>
) {
  return z.object({
    include: z.array(z.enum(includeOptions as [T, ...T[]]))
      .optional()
      .describe(
        `Related resources to include in response. Options:\n` +
        Object.entries(includeDescriptions)
          .map(([key, desc]) => `- ${key}: ${desc}`)
          .join('\n')
      ),
  });
}

/**
 * Helper function to build query builders array with sort and includes
 */
export async function buildQueryBuilders(options: {
  page?: number | undefined;
  perPage?: number | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
  include?: string[] | undefined;
  searchFilters?: ((search: InstanceType<typeof SearchQueryBuilder>) => void) | undefined;
}): Promise<QueryBuilderType[]> {
  const queryBuilders: QueryBuilderType[] = [];

  // Pagination
  if (options.page !== undefined || options.perPage !== undefined) {
    const pagination = new PaginationQueryBuilder();
    if (options.page) pagination.page(options.page);
    if (options.perPage) pagination.perPage(options.perPage);
    queryBuilders.push(pagination);
  }

  // Sort
  if (options.sortBy) {
    const sort = new SortQueryBuilder();
    if (options.sortOrder === 'asc') {
      sort.asc(options.sortBy);
    } else {
      sort.desc(options.sortBy);
    }
    queryBuilders.push(sort);
  }

  // Includes
  if (options.include && options.include.length > 0) {
    const includes = new IncludesQueryBuilder();
    for (const inc of options.include) {
      includes.includes(inc);
    }
    queryBuilders.push(includes);
  }

  // Search filters (entity-specific)
  // The callback is responsible for adding filters to the search builder.
  // We always add the search builder if a callback is provided, as even
  // an empty search builder is valid and the callback may conditionally add filters.
  if (options.searchFilters) {
    const search = new SearchQueryBuilder();
    options.searchFilters(search);
    // Only add if there are actual query parameters
    // Check if the search builder has any query string content
    const queryString = search.build();
    if (queryString && queryString.length > 0) {
      queryBuilders.push(search);
    }
  }

  return queryBuilders;
}
