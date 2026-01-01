/**
 * task_update - Update an existing task
 *
 * Modifies task details including name, description, rate, and billable status.
 */

import { z } from 'zod';
import { TaskUpdateInputSchema, TaskSchema } from './schemas.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { FreshBooksClientWrapper } from '../../client/index.js';

/**
 * Tool definition for task_update
 */
export const taskUpdateTool = {
  name: 'task_update',
  description: `Update an existing task in FreshBooks.

WHEN TO USE:
- Need to change task name or description
- Update billing rate for a task
- Change billable status
- Archive a task (set visState)

REQUIRED INFO:
- accountId: FreshBooks account ID
- taskId: Task ID (numeric identifier)

OPTIONAL PARAMETERS (at least one required):
- name: Updated task name
- description: Updated task description
- billable: Updated billable status
- rate: Updated billing rate
  - amount: Decimal string (e.g., "60.00")
  - code: Currency code
- visState: Visibility state (0=active, 1=deleted, 2=archived)

RETURNS:
Updated task with:
- Task ID (unchanged)
- New name, description, rate
- Updated billable status
- Updated visibility state

EXAMPLE PROMPTS:
- "Update task 123 to be non-billable"
- "Change task 456 name to Development Work"
- "Set task 789 rate to $85/hour"
- "Archive task 234"
- "Update task 567 description to include meetings"

BEST PRACTICES:
- Use visState to archive rather than delete
- Update rates when billing changes
- Keep task names and descriptions current
- Mark internal tasks as non-billable`,

  inputSchema: TaskUpdateInputSchema,
  outputSchema: TaskSchema,

  async execute(
    input: z.infer<typeof TaskUpdateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof TaskSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'task_update',
      async (input: z.infer<typeof TaskUpdateInputSchema>, _context: ToolContext) => {
        const { accountId, taskId, name, description, billable, rate, visState } = input;

        const result = await client.executeWithRetry('task_update', async (fbClient) => {
          // Build update data with only provided fields
          const updateData: Record<string, any> = {};

          if (name !== undefined) {
            updateData.name = name;
          }
          if (description !== undefined) {
            updateData.description = description;
          }
          if (billable !== undefined) {
            updateData.billable = billable;
          }
          if (rate !== undefined) {
            updateData.rate = rate;
          }
          if (visState !== undefined) {
            updateData.visState = visState;
          }

          const response = await fbClient.tasks.update(updateData as any, accountId, taskId);

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        return result as unknown as z.infer<typeof TaskSchema>;
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
