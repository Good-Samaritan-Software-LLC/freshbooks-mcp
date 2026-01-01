/**
 * Zod schemas for Task entity
 *
 * Tasks are project subtasks for detailed time tracking.
 * NOTE: FreshBooks API has alternate field names (name/tname, description/tdesc).
 */

import { z } from 'zod';
import { VisStateSchema, MoneySchema, AccountIdSchema } from '../base-tool.js';

/**
 * Core Task schema
 *
 * Handles both standard and alternate field names from the API
 */
export const TaskSchema = z.object({
  id: z.number().optional().describe('Unique task identifier'),
  taskid: z.number().optional().describe('Task ID (alternate field)'),
  name: z.string().nullable().optional().describe('Task name'),
  tname: z.string().nullable().optional().describe('Task name (alternate field)'),
  description: z.string().nullable().optional().describe('Task description'),
  tdesc: z.string().nullable().optional().describe('Task description (alternate field)'),
  billable: z.boolean().optional().describe('Whether task is billable'),
  rate: MoneySchema.optional().describe('Task billing rate'),
  visState: VisStateSchema.optional().describe('Visibility state'),
  updated: z.string().optional().describe('Last update timestamp'),
});

/**
 * Input schema for creating a task
 */
export const TaskCreateInputSchema = AccountIdSchema.extend({
  name: z.string().min(1).describe('Task name (required)'),
  description: z.string().optional().describe('Task description'),
  billable: z.boolean().default(true).describe('Whether task is billable'),
  rate: z
    .object({
      amount: z.string().describe('Rate amount as decimal string'),
      code: z.string().default('USD').describe('Currency code'),
    })
    .optional()
    .describe('Task billing rate'),
});

/**
 * Input schema for updating a task
 */
export const TaskUpdateInputSchema = AccountIdSchema.extend({
  taskId: z.number().int().positive().describe('Task ID to update'),
  name: z.string().optional().describe('Updated task name'),
  description: z.string().optional().describe('Updated task description'),
  billable: z.boolean().optional().describe('Whether task is billable'),
  rate: z
    .object({
      amount: z.string().describe('Rate amount as decimal string'),
      code: z.string().describe('Currency code'),
    })
    .optional()
    .describe('Updated task billing rate'),
  visState: VisStateSchema.optional().describe('Updated visibility state'),
});

/**
 * Output schema for list operations
 */
export const TaskListOutputSchema = z.object({
  tasks: z.array(TaskSchema),
  pagination: z.object({
    page: z.number(),
    pages: z.number(),
    total: z.number(),
    perPage: z.number(),
  }),
});

/**
 * Input schema for getting a single task
 */
export const TaskSingleInputSchema = AccountIdSchema.extend({
  taskId: z.number().int().positive().describe('Task ID to retrieve'),
});

/**
 * Input schema for deleting a task
 */
export const TaskDeleteInputSchema = AccountIdSchema.extend({
  taskId: z.number().int().positive().describe('Task ID to delete'),
});

/**
 * Success response for delete operations
 */
export const DeleteSuccessSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
