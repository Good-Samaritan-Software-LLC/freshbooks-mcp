/**
 * task_single - Get a single task by ID
 *
 * Retrieves detailed information for a specific task.
 */

import { z } from 'zod';
import { TaskSingleInputSchema, TaskSchema } from './schemas.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { FreshBooksClientWrapper } from '../../client/index.js';

/**
 * Tool definition for task_single
 */
export const taskSingleTool = {
  name: 'task_single',
  description: `Get a single task by ID from FreshBooks.

WHEN TO USE:
- Need detailed information about a specific task
- Verify task settings before using
- Check task rate and billable status
- Confirm task exists

REQUIRED INFO:
- accountId: FreshBooks account ID
- taskId: Task ID (numeric identifier)

RETURNS:
Complete task details including:
- Task ID, name, description
- Billable status and rate
- Visibility state
- Last update timestamp

EXAMPLE PROMPTS:
- "Get details for task 12345"
- "Show me task information for ID 789"
- "What is task 456 used for?"
- "Check if task 123 is billable"

NOTE: Task names may appear in either 'name' or 'tname' field due to API variations.`,

  inputSchema: TaskSingleInputSchema,
  outputSchema: TaskSchema,

  async execute(
    input: z.infer<typeof TaskSingleInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof TaskSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'task_single',
      async (input: z.infer<typeof TaskSingleInputSchema>, _context: ToolContext) => {
        const { accountId, taskId } = input;

        const result = await client.executeWithRetry('task_single', async (fbClient) => {
          const response = await fbClient.tasks.single(accountId, taskId);

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
