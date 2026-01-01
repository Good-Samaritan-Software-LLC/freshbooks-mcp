/**
 * task_create - Create a new task
 *
 * Creates a new project task for detailed time tracking.
 */

import { z } from 'zod';
import { TaskCreateInputSchema, TaskSchema } from './schemas.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { FreshBooksClientWrapper } from '../../client/index.js';

/**
 * Tool definition for task_create
 */
export const taskCreateTool = {
  name: 'task_create',
  description: `Create a new task in FreshBooks.

WHEN TO USE:
- User needs a new task category
- Setting up task breakdown for a project
- Creating specialized tracking categories
- Organizing work into billable tasks

REQUIRED INFO:
- accountId: FreshBooks account ID
- name: Task name (descriptive label)

OPTIONAL PARAMETERS:
- description: Detailed task description
- billable: Whether task is billable (default: true)
- rate: Task-specific billing rate
  - amount: Decimal string (e.g., "50.00")
  - code: Currency code (default: USD)

RETURNS:
Created task with:
- Task ID (for use in time entries)
- Name, description
- Billable status and rate
- Visibility state

EXAMPLE PROMPTS:
- "Create a task called Code Review"
- "Add a new billable task for Testing"
- "Set up a task for Documentation at $45/hour"
- "Create a non-billable task for Internal Meetings"

BEST PRACTICES:
- Use clear, specific task names
- Set appropriate rates for different task types
- Create non-billable tasks for internal work
- Add descriptions to clarify task purpose`,

  inputSchema: TaskCreateInputSchema,
  outputSchema: TaskSchema,

  async execute(
    input: z.infer<typeof TaskCreateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof TaskSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'task_create',
      async (input: z.infer<typeof TaskCreateInputSchema>, _context: ToolContext) => {
        const { accountId, name, description, billable, rate } = input;

        const result = await client.executeWithRetry('task_create', async (fbClient) => {
          const taskData: Record<string, any> = {
            name,
            billable,
          };

          if (description !== undefined) {
            taskData.description = description;
          }

          if (rate !== undefined) {
            taskData.rate = rate;
          }

          const response = await fbClient.tasks.create(taskData as any, accountId);

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
