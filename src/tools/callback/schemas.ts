/**
 * Zod schemas for Callback (Webhook) entity
 *
 * Webhook/callback schemas for FreshBooks event notifications
 */

import { z } from 'zod';

/**
 * Full Callback schema with all properties
 */
export const CallbackSchema = z.object({
  id: z.number().describe('Unique callback identifier'),
  event: z.string().describe('Event type to listen for (e.g., invoice.create, payment.create)'),
  uri: z.string().url().describe('Webhook endpoint URL to POST events to'),
  verified: z.boolean().describe('Whether webhook ownership has been verified'),
  createdAt: z.string().datetime().describe('Creation timestamp (ISO 8601)'),
  updatedAt: z.string().datetime().describe('Last update timestamp (ISO 8601)'),
});

/**
 * Input schema for creating a callback
 */
export const CallbackCreateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  event: z.string().min(1).describe('Event type to listen for (e.g., invoice.create, payment.create, time_entry.create)'),
  uri: z.string().url().describe('Your webhook endpoint URL (must be HTTPS and publicly accessible)'),
});

/**
 * Input schema for updating a callback
 */
export const CallbackUpdateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  callbackId: z.number().describe('Callback ID to update'),
  event: z.string().min(1).optional().describe('Event type to listen for'),
  uri: z.string().url().optional().describe('Webhook endpoint URL'),
});

/**
 * Input schema for listing callbacks
 */
export const CallbackListInputSchema = z.object({
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
});

/**
 * Input schema for getting a single callback
 */
export const CallbackSingleInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  callbackId: z.number().describe('Callback ID to retrieve'),
});

/**
 * Input schema for deleting a callback
 */
export const CallbackDeleteInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  callbackId: z.number().describe('Callback ID to delete'),
});

/**
 * Input schema for verifying a callback
 */
export const CallbackVerifyInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  callbackId: z.number().describe('Callback ID to verify'),
  verifier: z.string().describe('Verification code received at your webhook endpoint'),
});

/**
 * Input schema for resending verification
 */
export const CallbackResendVerificationInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  callbackId: z.number().describe('Callback ID to resend verification for'),
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
 * Output schema for callback list
 */
export const CallbackListOutputSchema = z.object({
  callbacks: z.array(CallbackSchema).describe('Array of callbacks'),
  pagination: PaginationMetadataSchema.describe('Pagination information'),
});

/**
 * Output schema for single callback operations
 */
export const CallbackSingleOutputSchema = CallbackSchema;

/**
 * Output schema for callback deletion
 */
export const CallbackDeleteOutputSchema = z.object({
  success: z.boolean().describe('Whether deletion was successful'),
  callbackId: z.number().describe('ID of deleted callback'),
});

/**
 * Output schema for callback verification
 */
export const CallbackVerifyOutputSchema = z.object({
  success: z.boolean().describe('Whether verification was successful'),
  verified: z.boolean().describe('Current verification status'),
  callbackId: z.number().describe('ID of verified callback'),
});
