/**
 * TimeEntry Zod Schemas
 *
 * Type-safe schemas for TimeEntry operations.
 * Maps directly to FreshBooks TimeEntry API.
 */

import { z } from 'zod';

/**
 * Timer schema (embedded in TimeEntry)
 */
export const TimerSchema = z.object({
  id: z.number().optional(),
  isRunning: z.boolean().nullable().optional(),
});

/**
 * Full TimeEntry entity schema
 */
export const TimeEntrySchema = z.object({
  id: z.number().optional(),
  identityId: z.number().optional(),
  isLogged: z.boolean(),
  startedAt: z.string().datetime(),
  createdAt: z.string().datetime().optional(),
  clientId: z.number().nullable().optional(),
  projectId: z.number().nullable().optional(),
  pendingClient: z.string().nullable().optional(),
  pendingProject: z.string().nullable().optional(),
  pendingTask: z.string().nullable().optional(),
  taskId: z.number().nullable().optional(),
  serviceId: z.number().nullable().optional(),
  note: z.string().nullable().optional(),
  active: z.boolean().optional(),
  billable: z.boolean().optional(),
  billed: z.boolean().optional(),
  internal: z.boolean().optional(),
  retainerId: z.number().nullable().optional(),
  duration: z.number(),
  timer: TimerSchema.nullable().optional(),
});

/**
 * Input schema for creating a time entry
 */
export const TimeEntryCreateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  duration: z.number().min(0).describe('Duration in seconds (0 for active timer)'),
  isLogged: z.boolean().default(true).describe('Whether time is logged (false for active timer)'),
  startedAt: z
    .string()
    .datetime()
    .optional()
    .describe('Start time (ISO 8601). Defaults to now if not specified'),
  note: z.string().optional().describe('Description of work performed'),
  projectId: z.number().optional().describe('Associated project ID'),
  clientId: z.number().optional().describe('Associated client ID'),
  serviceId: z.number().optional().describe('Associated service ID'),
  taskId: z.number().optional().describe('Associated task ID'),
  billable: z.boolean().optional().describe('Whether time is billable'),
  active: z.boolean().default(false).describe('Whether this is an active timer'),
  internal: z.boolean().optional().describe('Whether this is internal work'),
  retainerId: z.number().optional().describe('Associated retainer ID'),
});

/**
 * Input schema for updating a time entry
 */
export const TimeEntryUpdateInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  timeEntryId: z.number().describe('Time entry ID to update'),
  duration: z.number().min(0).optional().describe('Duration in seconds'),
  isLogged: z.boolean().optional().describe('Whether time is logged'),
  startedAt: z.string().datetime().optional().describe('Start time (ISO 8601)'),
  note: z.string().optional().describe('Description of work performed'),
  projectId: z.number().nullable().optional().describe('Associated project ID'),
  clientId: z.number().nullable().optional().describe('Associated client ID'),
  serviceId: z.number().nullable().optional().describe('Associated service ID'),
  taskId: z.number().nullable().optional().describe('Associated task ID'),
  billable: z.boolean().optional().describe('Whether time is billable'),
  active: z.boolean().optional().describe('Whether this is an active timer'),
  internal: z.boolean().optional().describe('Whether this is internal work'),
  retainerId: z.number().nullable().optional().describe('Associated retainer ID'),
});

/**
 * Input schema for listing time entries
 */
export const TimeEntryListInputSchema = z.object({
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
  projectId: z.number().optional().describe('Filter by project ID'),
  clientId: z.number().optional().describe('Filter by client ID'),
  taskId: z.number().optional().describe('Filter by task ID'),
  serviceId: z.number().optional().describe('Filter by service ID'),
  active: z.boolean().optional().describe('Filter by active status (running timers)'),
  billable: z.boolean().optional().describe('Filter by billable status'),
  billed: z.boolean().optional().describe('Filter by billed status'),
  startedAfter: z
    .string()
    .datetime()
    .optional()
    .describe('Filter entries started after this date (ISO 8601)'),
  startedBefore: z
    .string()
    .datetime()
    .optional()
    .describe('Filter entries started before this date (ISO 8601)'),
});

/**
 * Input schema for getting a single time entry
 */
export const TimeEntrySingleInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  timeEntryId: z.number().describe('Time entry ID to retrieve'),
});

/**
 * Input schema for deleting a time entry
 */
export const TimeEntryDeleteInputSchema = z.object({
  accountId: z.string().describe('FreshBooks account ID'),
  timeEntryId: z.number().describe('Time entry ID to delete'),
});

/**
 * Pagination metadata schema
 */
export const PaginationSchema = z.object({
  page: z.number(),
  pages: z.number(),
  perPage: z.number(),
  total: z.number(),
});

/**
 * Output schema for list operations
 */
export const TimeEntryListOutputSchema = z.object({
  timeEntries: z.array(TimeEntrySchema),
  pagination: PaginationSchema,
});

/**
 * Output schema for single/create/update operations
 */
export const TimeEntrySingleOutputSchema = TimeEntrySchema;

/**
 * Output schema for delete operations
 */
export const TimeEntryDeleteOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  timeEntryId: z.number(),
});
