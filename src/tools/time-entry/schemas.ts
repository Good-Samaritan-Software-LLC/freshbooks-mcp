/**
 * TimeEntry Zod Schemas
 *
 * Type-safe schemas for TimeEntry operations.
 * Maps directly to FreshBooks TimeEntry API.
 */

import { z } from 'zod';
import { createSortSchema, createIncludesSchema } from '../base-tool.js';

/**
 * TimeEntry sortable fields
 */
export const TIMEENTRY_SORTABLE_FIELDS = [
  'started_at',
  'created_at',
  'duration',
] as const;

/**
 * TimeEntry sort field descriptions
 */
export const TIMEENTRY_SORT_FIELD_DESCRIPTIONS: Record<typeof TIMEENTRY_SORTABLE_FIELDS[number], string> = {
  started_at: 'When the time entry started',
  created_at: 'When the entry was created in FreshBooks',
  duration: 'Length of the time entry in seconds',
};

/**
 * TimeEntry include options
 */
export const TIMEENTRY_INCLUDE_OPTIONS = [
  'client',
  'project',
  'task',
  'service',
] as const;

/**
 * TimeEntry include option descriptions
 */
export const TIMEENTRY_INCLUDE_DESCRIPTIONS: Record<typeof TIMEENTRY_INCLUDE_OPTIONS[number], string> = {
  client: 'Client details associated with the time entry',
  project: 'Project details for the time entry',
  task: 'Task information if assigned',
  service: 'Service type used for billing categorization',
};

/**
 * TimeEntry sort schema
 */
export const TimeEntrySortSchema = createSortSchema(
  TIMEENTRY_SORTABLE_FIELDS,
  TIMEENTRY_SORT_FIELD_DESCRIPTIONS
);

/**
 * TimeEntry includes schema
 */
export const TimeEntryIncludesSchema = createIncludesSchema(
  TIMEENTRY_INCLUDE_OPTIONS,
  TIMEENTRY_INCLUDE_DESCRIPTIONS
);

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
  businessId: z.number().int().positive().describe('FreshBooks business ID (get from user_me -> businessMemberships[].business.id)'),
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
  businessId: z.number().int().positive().describe('FreshBooks business ID (get from user_me -> businessMemberships[].business.id)'),
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
  businessId: z.number().int().positive().describe('FreshBooks business ID (get from user_me -> businessMemberships[].business.id)'),
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
    .optional()
    .describe('Filter entries started after this date (YYYY-MM-DD or ISO 8601 datetime)')
    .transform((val) => {
      if (!val) return val;
      // If just a date, append midnight UTC
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return `${val}T00:00:00Z`;
      }
      return val;
    }),
  startedBefore: z
    .string()
    .optional()
    .describe('Filter entries started before this date (YYYY-MM-DD or ISO 8601 datetime)')
    .transform((val) => {
      if (!val) return val;
      // If just a date, append end of day UTC
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return `${val}T23:59:59Z`;
      }
      return val;
    }),
})
  .merge(TimeEntrySortSchema)
  .merge(TimeEntryIncludesSchema);

/**
 * Input schema for getting a single time entry
 */
export const TimeEntrySingleInputSchema = z.object({
  businessId: z.number().int().positive().describe('FreshBooks business ID (get from user_me -> businessMemberships[].business.id)'),
  timeEntryId: z.number().describe('Time entry ID to retrieve'),
});

/**
 * Input schema for deleting a time entry
 */
export const TimeEntryDeleteInputSchema = z.object({
  businessId: z.number().int().positive().describe('FreshBooks business ID (get from user_me -> businessMemberships[].business.id)'),
  timeEntryId: z.number().describe('Time entry ID to delete'),
  confirmed: z.boolean().optional().describe('Set to true to confirm deletion of this time entry'),
  confirmationId: z.string().optional().describe('Confirmation token from the initial delete request (required with confirmed: true)'),
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
