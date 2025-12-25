/**
 * Pagination utilities for FreshBooks API
 */

import { z } from 'zod';
import type { PaginationParams, PaginationMetadata } from '../types/index.js';

/**
 * Standard pagination schema for tool inputs
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
 * Extract pagination parameters from input
 */
export function getPaginationParams(input: unknown): PaginationParams {
  const parsed = PaginationSchema.safeParse(input || {});

  if (parsed.success) {
    return parsed.data;
  }

  // Return defaults if parsing fails
  return {
    page: 1,
    perPage: 30,
  };
}

/**
 * Create pagination metadata for responses
 */
export function createPaginationMetadata(
  page: number,
  perPage: number,
  total: number
): PaginationMetadata {
  const pages = Math.ceil(total / perPage);

  return {
    page,
    pages,
    perPage,
    total,
  };
}

/**
 * Check if there are more pages available
 */
export function hasMorePages(pagination: PaginationMetadata): boolean {
  return pagination.page < pagination.pages;
}

/**
 * Get next page number, or null if no more pages
 */
export function getNextPage(pagination: PaginationMetadata): number | null {
  return hasMorePages(pagination) ? pagination.page + 1 : null;
}

/**
 * Get previous page number, or null if on first page
 */
export function getPreviousPage(pagination: PaginationMetadata): number | null {
  return pagination.page > 1 ? pagination.page - 1 : null;
}
