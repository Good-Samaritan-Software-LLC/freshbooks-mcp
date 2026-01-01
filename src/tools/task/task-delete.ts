/**
 * task_delete - Delete a task
 *
 * Permanently deletes a task from FreshBooks.
 * WARNING: This is irreversible. Consider using task_update with visState=1 to archive instead.
 */

import { z } from 'zod';
import { TaskDeleteInputSchema, DeleteSuccessSchema } from './schemas.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { FreshBooksClientWrapper } from '../../client/index.js';

/**
 * Tool definition for task_delete
 */
export const taskDeleteTool = {
  name: 'task_delete',
  description: `Delete a task from FreshBooks.

WHEN TO USE:
- Need to permanently remove a task
- Cleaning up test/duplicate tasks
- Removing incorrectly created tasks

REQUIRED INFO:
- accountId: FreshBooks account ID
- taskId: Task ID (numeric identifier)

IMPORTANT WARNINGS:
- This is PERMANENT and IRREVERSIBLE
- Cannot recover deleted tasks
- Consider using task_update with visState=1 to archive instead
- Deleted tasks cannot be used in new time entries
- Existing time entries with this task will retain the reference

RETURNS:
Success confirmation:
- success: true if deleted
- message: Confirmation message

EXAMPLE PROMPTS:
- "Delete task 12345"
- "Remove task ID 789"
- "Permanently delete the Testing task"

BEST PRACTICE:
⚠️ ARCHIVE INSTEAD: Use task_update with visState=1 to soft-delete tasks.
This preserves data integrity while hiding the task from active lists.

DELETE ONLY IF:
- Task was created by mistake
- Task has no time entries associated
- You're absolutely certain it should be removed`,

  inputSchema: TaskDeleteInputSchema,
  outputSchema: DeleteSuccessSchema,

  async execute(
    input: z.infer<typeof TaskDeleteInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof DeleteSuccessSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'task_delete',
      async (input: z.infer<typeof TaskDeleteInputSchema>, _context: ToolContext) => {
        const { accountId, taskId } = input;

        await client.executeWithRetry('task_delete', async (fbClient) => {
          const response = await fbClient.tasks.delete(accountId, taskId);

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        return {
          success: true,
          message: `Task ${taskId} has been permanently deleted`,
        };
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
