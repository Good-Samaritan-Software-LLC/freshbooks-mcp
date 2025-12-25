/**
 * Zod schemas for Project entity
 *
 * Project management schemas for FreshBooks API
 */

import { z } from 'zod';

/**
 * Billing method enum - how the project is billed
 */
export const BillingMethodEnum = z.enum([
  'project_rate',
  'service_rate',
  'flat_rate',
  'team_member_rate',
]);

/**
 * Project type enum
 */
export const ProjectTypeEnum = z.enum(['fixed_price', 'hourly_rate']);

/**
 * Billed status enum
 */
export const BilledStatusEnum = z.enum(['unbilled', 'partial', 'billed']);

/**
 * Full Project schema with all properties
 */
export const ProjectSchema = z.object({
  id: z.number().describe('Unique project identifier'),
  title: z.string().describe('Project title'),
  description: z.string().nullable().describe('Project description'),
  dueDate: z.string().datetime().nullable().describe('Project due date (ISO 8601)'),
  clientId: z.string().nullable().describe('Associated client ID'),
  internal: z.boolean().describe('Whether project is internal (non-billable)'),
  budget: z.string().nullable().describe('Project budget amount'),
  fixedPrice: z.string().nullable().describe('Fixed price amount for flat-rate projects'),
  rate: z.string().nullable().describe('Hourly rate for time-based billing'),
  billingMethod: BillingMethodEnum.nullable().describe('How project is billed'),
  projectType: ProjectTypeEnum.describe('Type of project (fixed_price or hourly_rate)'),
  projectManagerId: z.string().nullable().describe('Project manager user ID'),
  active: z.boolean().describe('Whether project is active'),
  complete: z.boolean().describe('Whether project is marked complete'),
  sample: z.boolean().describe('Whether project is a sample/demo'),
  createdAt: z.string().datetime().describe('Creation timestamp (ISO 8601)'),
  updatedAt: z.string().datetime().describe('Last update timestamp (ISO 8601)'),
  loggedDuration: z.number().nullable().describe('Total logged time in seconds'),
  services: z.array(z.any()).nullable().describe('Associated services'),
  billedAmount: z.number().describe('Total billed amount'),
  billedStatus: BilledStatusEnum.describe('Billing status'),
  retainerId: z.string().nullable().describe('Associated retainer ID'),
  expenseMarkup: z.number().describe('Expense markup percentage'),
  groupId: z.string().nullable().describe('Project group ID'),
  group: z.any().nullable().describe('Project group details'),
});

/**
 * Input schema for creating a project
 */
export const ProjectCreateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  title: z.string().min(1).describe('Project title (required)'),
  clientId: z.string().optional().describe('Associated client ID'),
  description: z.string().optional().describe('Project description'),
  dueDate: z.string().datetime().optional().describe('Project due date (ISO 8601)'),
  budget: z.string().optional().describe('Project budget amount'),
  fixedPrice: z.string().optional().describe('Fixed price amount'),
  rate: z.string().optional().describe('Hourly rate'),
  billingMethod: BillingMethodEnum.optional().describe('How project is billed'),
  projectType: ProjectTypeEnum.optional().describe('Type of project'),
  internal: z.boolean().optional().describe('Whether project is internal'),
  projectManagerId: z.string().optional().describe('Project manager user ID'),
});

/**
 * Input schema for updating a project
 */
export const ProjectUpdateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  projectId: z.number().describe('Project ID to update'),
  title: z.string().min(1).optional().describe('Project title'),
  clientId: z.string().optional().describe('Associated client ID'),
  description: z.string().optional().describe('Project description'),
  dueDate: z.string().datetime().optional().describe('Project due date (ISO 8601)'),
  budget: z.string().optional().describe('Project budget amount'),
  fixedPrice: z.string().optional().describe('Fixed price amount'),
  rate: z.string().optional().describe('Hourly rate'),
  billingMethod: BillingMethodEnum.optional().describe('How project is billed'),
  projectType: ProjectTypeEnum.optional().describe('Type of project'),
  internal: z.boolean().optional().describe('Whether project is internal'),
  projectManagerId: z.string().optional().describe('Project manager user ID'),
  active: z.boolean().optional().describe('Whether project is active'),
  complete: z.boolean().optional().describe('Whether project is complete'),
});

/**
 * Input schema for listing projects
 */
export const ProjectListInputSchema = z.object({
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
  clientId: z.string().optional().describe('Filter by client ID'),
  active: z.boolean().optional().describe('Filter by active status'),
  complete: z.boolean().optional().describe('Filter by completion status'),
  internal: z.boolean().optional().describe('Filter by internal status'),
  title: z.string().optional().describe('Filter by title (partial match)'),
});

/**
 * Input schema for getting a single project
 */
export const ProjectSingleInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  projectId: z.number().describe('Project ID to retrieve'),
  includes: z.array(z.enum(['client', 'services', 'group'])).optional().describe('Related data to include'),
});

/**
 * Input schema for deleting a project
 */
export const ProjectDeleteInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  projectId: z.number().describe('Project ID to delete'),
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
 * Output schema for project list
 */
export const ProjectListOutputSchema = z.object({
  projects: z.array(ProjectSchema).describe('Array of projects'),
  pagination: PaginationMetadataSchema.describe('Pagination information'),
});

/**
 * Output schema for single project operations
 */
export const ProjectSingleOutputSchema = ProjectSchema;

/**
 * Output schema for project deletion
 */
export const ProjectDeleteOutputSchema = z.object({
  success: z.boolean().describe('Whether deletion was successful'),
  projectId: z.number().describe('ID of deleted project'),
});
