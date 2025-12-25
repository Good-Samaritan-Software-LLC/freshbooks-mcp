/**
 * Zod schemas for BillVendor entity
 *
 * Bill vendor management schemas for FreshBooks API
 */

import { z } from 'zod';
import { VisStateSchema } from '../base-tool.js';

/**
 * Full BillVendor schema with all properties
 */
export const BillVendorSchema = z.object({
  id: z.number().describe('Unique vendor identifier'),
  vendorName: z.string().describe('Vendor/supplier name'),
  contactName: z.string().nullable().describe('Contact person name'),
  email: z.string().nullable().describe('Vendor email address'),
  phone: z.string().nullable().describe('Vendor phone number'),
  website: z.string().nullable().describe('Vendor website'),
  address: z.string().nullable().describe('Street address'),
  city: z.string().nullable().describe('City'),
  province: z.string().nullable().describe('Province/state'),
  postalCode: z.string().nullable().describe('Postal/ZIP code'),
  country: z.string().nullable().describe('Country'),
  currencyCode: z.string().describe('Currency code (e.g., USD)'),
  accountNumber: z.string().nullable().describe('Vendor account number'),
  taxNumber: z.string().nullable().describe('Tax ID/VAT number'),
  note: z.string().nullable().describe('Notes about vendor'),
  is1099: z.boolean().optional().describe('Whether vendor is 1099 eligible (US)'),
  language: z.string().optional().describe('Preferred language'),
  visState: VisStateSchema.optional().describe('Visibility state'),
  createdAt: z.string().datetime().describe('Creation timestamp (ISO 8601)'),
  updatedAt: z.string().datetime().describe('Last update timestamp (ISO 8601)'),
});

/**
 * Input schema for creating a vendor
 */
export const BillVendorCreateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  vendorName: z.string().min(1).describe('Vendor/supplier name (required)'),
  contactName: z.string().optional().describe('Contact person name'),
  email: z.string().email().optional().describe('Vendor email address'),
  phone: z.string().optional().describe('Vendor phone number'),
  website: z.string().url().optional().describe('Vendor website'),
  address: z.string().optional().describe('Street address'),
  city: z.string().optional().describe('City'),
  province: z.string().optional().describe('Province/state'),
  postalCode: z.string().optional().describe('Postal/ZIP code'),
  country: z.string().optional().describe('Country'),
  currencyCode: z.string().default('USD').describe('Currency code (e.g., USD)'),
  accountNumber: z.string().optional().describe('Vendor account number'),
  taxNumber: z.string().optional().describe('Tax ID/VAT number'),
  note: z.string().optional().describe('Notes about vendor'),
  is1099: z.boolean().optional().describe('Whether vendor is 1099 eligible (US)'),
  language: z.string().optional().describe('Preferred language'),
});

/**
 * Input schema for updating a vendor
 */
export const BillVendorUpdateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  vendorId: z.number().describe('Vendor ID to update'),
  vendorName: z.string().min(1).optional().describe('Vendor/supplier name'),
  contactName: z.string().optional().describe('Contact person name'),
  email: z.string().email().optional().describe('Vendor email address'),
  phone: z.string().optional().describe('Vendor phone number'),
  website: z.string().url().optional().describe('Vendor website'),
  address: z.string().optional().describe('Street address'),
  city: z.string().optional().describe('City'),
  province: z.string().optional().describe('Province/state'),
  postalCode: z.string().optional().describe('Postal/ZIP code'),
  country: z.string().optional().describe('Country'),
  currencyCode: z.string().optional().describe('Currency code (e.g., USD)'),
  accountNumber: z.string().optional().describe('Vendor account number'),
  taxNumber: z.string().optional().describe('Tax ID/VAT number'),
  note: z.string().optional().describe('Notes about vendor'),
  is1099: z.boolean().optional().describe('Whether vendor is 1099 eligible (US)'),
  language: z.string().optional().describe('Preferred language'),
});

/**
 * Input schema for listing vendors
 */
export const BillVendorListInputSchema = z.object({
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
  vendorName: z.string().optional().describe('Filter by vendor name (partial match)'),
  email: z.string().optional().describe('Filter by email'),
});

/**
 * Input schema for getting a single vendor
 */
export const BillVendorSingleInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  vendorId: z.number().describe('Vendor ID to retrieve'),
});

/**
 * Input schema for deleting a vendor
 */
export const BillVendorDeleteInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  vendorId: z.number().describe('Vendor ID to delete'),
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
 * Output schema for vendor list
 */
export const BillVendorListOutputSchema = z.object({
  vendors: z.array(BillVendorSchema).describe('Array of vendors'),
  pagination: PaginationMetadataSchema.describe('Pagination information'),
});

/**
 * Output schema for single vendor operations
 */
export const BillVendorSingleOutputSchema = BillVendorSchema;

/**
 * Output schema for vendor deletion
 */
export const BillVendorDeleteOutputSchema = z.object({
  success: z.boolean().describe('Whether deletion was successful'),
  vendorId: z.number().describe('ID of deleted vendor'),
});
