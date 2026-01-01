/**
 * Zod schemas for Service entity
 *
 * Services are billable service types that can be assigned to time entries.
 * NOTE: Services are immutable once created - use visState to archive.
 */

import { z } from 'zod';
import { VisStateSchema } from '../base-tool.js';

/**
 * Core Service schema
 */
export const ServiceSchema = z.object({
  id: z.number().describe('Unique service identifier'),
  businessId: z.number().describe('Associated business ID'),
  name: z.string().describe('Service name'),
  billable: z.boolean().describe('Whether service is billable'),
  visState: VisStateSchema.optional().describe('Visibility state'),
});

/**
 * Service rate schema
 */
export const ServiceRateSchema = z.object({
  rate: z.string().describe('Rate amount as decimal string'),
  code: z.string().describe('Currency code (e.g., USD)'),
});

/**
 * Input schema for creating a service
 */
export const ServiceCreateInputSchema = z.object({
  businessId: z.number().int().positive().describe('FreshBooks business ID'),
  name: z.string().min(1).describe('Service name (required)'),
  billable: z.boolean().default(true).describe('Whether service is billable'),
});

/**
 * Output schema for list operations
 */
export const ServiceListOutputSchema = z.object({
  services: z.array(ServiceSchema),
  pagination: z.object({
    page: z.number(),
    pages: z.number(),
    total: z.number(),
    perPage: z.number(),
  }),
});

/**
 * Input schema for getting a service rate
 */
export const ServiceRateGetInputSchema = z.object({
  businessId: z.number().int().positive().describe('FreshBooks business ID'),
  serviceId: z.number().int().positive().describe('Service ID'),
});

/**
 * Input schema for setting a service rate
 */
export const ServiceRateSetInputSchema = z.object({
  businessId: z.number().int().positive().describe('FreshBooks business ID'),
  serviceId: z.number().int().positive().describe('Service ID'),
  rate: z.string().describe('Rate amount as decimal string (e.g., "75.00")'),
  code: z.string().default('USD').describe('Currency code (e.g., USD)'),
});
