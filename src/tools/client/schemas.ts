/**
 * Zod schemas for Client entity
 *
 * Client/customer information schemas for FreshBooks API
 */

import { z } from 'zod';
import { createSortSchema, createIncludesSchema } from '../base-tool.js';

/**
 * Client sortable fields
 */
export const CLIENT_SORTABLE_FIELDS = [
  'organization',
  'fname',
  'lname',
  'email',
  'updated',
] as const;

/**
 * Client sort field descriptions
 */
export const CLIENT_SORT_FIELD_DESCRIPTIONS: Record<typeof CLIENT_SORTABLE_FIELDS[number], string> = {
  organization: 'Company/organization name',
  fname: 'First name',
  lname: 'Last name',
  email: 'Email address',
  updated: 'Last modification time',
};

/**
 * Client include options
 */
export const CLIENT_INCLUDE_OPTIONS = [
  'outstanding_balance',
  'credit_balance',
] as const;

/**
 * Client include option descriptions
 */
export const CLIENT_INCLUDE_DESCRIPTIONS: Record<typeof CLIENT_INCLUDE_OPTIONS[number], string> = {
  outstanding_balance: 'Total outstanding (unpaid) balance across all invoices',
  credit_balance: 'Available credit balance for the client',
};

/**
 * Client sort schema
 */
export const ClientSortSchema = createSortSchema(
  CLIENT_SORTABLE_FIELDS,
  CLIENT_SORT_FIELD_DESCRIPTIONS
);

/**
 * Client includes schema
 */
export const ClientIncludesSchema = createIncludesSchema(
  CLIENT_INCLUDE_OPTIONS,
  CLIENT_INCLUDE_DESCRIPTIONS
);

/**
 * Visibility state enum
 */
export const VisStateEnum = z.union([z.literal(0), z.literal(1), z.literal(2)]).describe(
  'Visibility state: 0=active, 1=deleted, 2=archived'
);

/**
 * Full Client schema with all properties
 * Note: Most properties are optional to match SDK Client interface
 */
export const ClientSchema = z.object({
  id: z.number().describe('Unique client identifier'),
  fName: z.string().nullable().optional().describe('First name'),
  lName: z.string().nullable().optional().describe('Last name'),
  organization: z.string().nullable().optional().describe('Organization/company name'),
  email: z.string().nullable().optional().describe('Email address'),
  busPhone: z.string().optional().describe('Business phone number'),
  homePhone: z.string().nullable().optional().describe('Home phone number'),
  mobPhone: z.string().optional().describe('Mobile phone number'),
  fax: z.string().optional().describe('Fax number'),
  note: z.string().nullable().optional().describe('Notes about the client'),
  // Primary address
  pStreet: z.string().optional().describe('Primary street address'),
  pStreet2: z.string().optional().describe('Primary street address line 2'),
  pCity: z.string().optional().describe('Primary city'),
  pProvince: z.string().optional().describe('Primary province/state'),
  pCode: z.string().optional().describe('Primary postal/zip code'),
  pCountry: z.string().optional().describe('Primary country'),
  // Secondary address
  sStreet: z.string().optional().describe('Secondary street address'),
  sStreet2: z.string().optional().describe('Secondary street address line 2'),
  sCity: z.string().optional().describe('Secondary city'),
  sProvince: z.string().optional().describe('Secondary province/state'),
  sCode: z.string().optional().describe('Secondary postal/zip code'),
  sCountry: z.string().optional().describe('Secondary country'),
  // Financial and settings
  currencyCode: z.string().optional().describe('Currency code (e.g., USD, CAD, EUR)'),
  language: z.string().nullable().optional().describe('Preferred language'),
  vatNumber: z.string().nullable().optional().describe('VAT/tax identification number'),
  vatName: z.string().nullable().optional().describe('VAT/tax name'),
  visState: VisStateEnum.optional().describe('Visibility state'),
  signupDate: z.string().datetime().nullable().optional().describe('Client signup date (ISO 8601)'),
  updated: z.string().datetime().nullable().optional().describe('Last update timestamp (ISO 8601)'),
  // Billing preferences
  allowLateFees: z.boolean().optional().describe('Whether to allow late fees'),
  allowLateNotifications: z.boolean().optional().describe('Whether to send late payment notifications'),
  hasRetainer: z.boolean().nullable().optional().describe('Whether client has a retainer'),
  retainerId: z.string().nullable().optional().describe('Associated retainer ID'),
}).passthrough();

/**
 * Input schema for creating a client
 */
export const ClientCreateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  // Contact info (at least one name or organization required)
  fName: z.string().optional().describe('First name'),
  lName: z.string().optional().describe('Last name'),
  organization: z.string().optional().describe('Organization/company name'),
  email: z.string().email().optional().describe('Email address'),
  // Phone numbers
  busPhone: z.string().optional().describe('Business phone number'),
  homePhone: z.string().optional().describe('Home phone number'),
  mobPhone: z.string().optional().describe('Mobile phone number'),
  fax: z.string().optional().describe('Fax number'),
  note: z.string().optional().describe('Notes about the client'),
  // Primary address
  pStreet: z.string().optional().describe('Primary street address'),
  pStreet2: z.string().optional().describe('Primary street address line 2'),
  pCity: z.string().optional().describe('Primary city'),
  pProvince: z.string().optional().describe('Primary province/state'),
  pCode: z.string().optional().describe('Primary postal/zip code'),
  pCountry: z.string().optional().describe('Primary country'),
  // Secondary address
  sStreet: z.string().optional().describe('Secondary street address'),
  sStreet2: z.string().optional().describe('Secondary street address line 2'),
  sCity: z.string().optional().describe('Secondary city'),
  sProvince: z.string().optional().describe('Secondary province/state'),
  sCode: z.string().optional().describe('Secondary postal/zip code'),
  sCountry: z.string().optional().describe('Secondary country'),
  // Financial settings
  currencyCode: z.string().optional().describe('Currency code (e.g., USD, CAD, EUR)'),
  language: z.string().optional().describe('Preferred language'),
  vatNumber: z.string().optional().describe('VAT/tax identification number'),
  vatName: z.string().optional().describe('VAT/tax name'),
  // Billing preferences
  allowLateFees: z.boolean().optional().describe('Whether to allow late fees'),
  allowLateNotifications: z.boolean().optional().describe('Whether to send late payment notifications'),
});

/**
 * Input schema for updating a client
 */
export const ClientUpdateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  clientId: z.number().describe('Client ID to update'),
  // All fields optional for updates
  fName: z.string().optional().describe('First name'),
  lName: z.string().optional().describe('Last name'),
  organization: z.string().optional().describe('Organization/company name'),
  email: z.string().email().optional().describe('Email address'),
  // Phone numbers
  busPhone: z.string().optional().describe('Business phone number'),
  homePhone: z.string().optional().describe('Home phone number'),
  mobPhone: z.string().optional().describe('Mobile phone number'),
  fax: z.string().optional().describe('Fax number'),
  note: z.string().optional().describe('Notes about the client'),
  // Primary address
  pStreet: z.string().optional().describe('Primary street address'),
  pStreet2: z.string().optional().describe('Primary street address line 2'),
  pCity: z.string().optional().describe('Primary city'),
  pProvince: z.string().optional().describe('Primary province/state'),
  pCode: z.string().optional().describe('Primary postal/zip code'),
  pCountry: z.string().optional().describe('Primary country'),
  // Secondary address
  sStreet: z.string().optional().describe('Secondary street address'),
  sStreet2: z.string().optional().describe('Secondary street address line 2'),
  sCity: z.string().optional().describe('Secondary city'),
  sProvince: z.string().optional().describe('Secondary province/state'),
  sCode: z.string().optional().describe('Secondary postal/zip code'),
  sCountry: z.string().optional().describe('Secondary country'),
  // Financial settings
  currencyCode: z.string().optional().describe('Currency code (e.g., USD, CAD, EUR)'),
  language: z.string().optional().describe('Preferred language'),
  vatNumber: z.string().optional().describe('VAT/tax identification number'),
  vatName: z.string().optional().describe('VAT/tax name'),
  // Billing preferences
  allowLateFees: z.boolean().optional().describe('Whether to allow late fees'),
  allowLateNotifications: z.boolean().optional().describe('Whether to send late payment notifications'),
  visState: VisStateEnum.optional().describe('Visibility state'),
});

/**
 * Input schema for listing clients
 */
export const ClientListInputSchema = z.object({
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
  // Search filters
  email: z.string().optional().describe('Filter by email address (exact match)'),
  organization: z.string().optional().describe('Filter by organization name (partial match)'),
  fName: z.string().optional().describe('Filter by first name (partial match)'),
  lName: z.string().optional().describe('Filter by last name (partial match)'),
  visState: VisStateEnum.optional().describe('Filter by visibility state'),
})
  .merge(ClientSortSchema)
  .merge(ClientIncludesSchema);

/**
 * Input schema for getting a single client
 */
export const ClientSingleInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  clientId: z.number().describe('Client ID to retrieve'),
});

/**
 * Input schema for deleting a client
 */
export const ClientDeleteInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  clientId: z.number().describe('Client ID to delete'),
  confirmed: z.boolean().optional().describe('Set to true to confirm deletion of this client'),
  confirmationId: z.string().optional().describe('Confirmation token from the initial delete request (required with confirmed: true)'),
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
 * Output schema for client list
 */
export const ClientListOutputSchema = z.object({
  clients: z.array(ClientSchema).describe('Array of clients'),
  pagination: PaginationMetadataSchema.describe('Pagination information'),
});

/**
 * Output schema for single client operations
 */
export const ClientSingleOutputSchema = ClientSchema;

/**
 * Output schema for client deletion
 */
export const ClientDeleteOutputSchema = z.object({
  success: z.boolean().describe('Whether deletion was successful'),
  clientId: z.number().describe('ID of deleted client'),
});
