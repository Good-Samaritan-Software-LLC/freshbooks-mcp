/**
 * task_list - List all tasks
 *
 * Retrieves project tasks for detailed time tracking.
 */

import { z } from 'zod';
import { AccountIdSchema, PaginationSchema } from '../base-tool.js';
import { TaskListOutputSchema } from './schemas.js';
import { ErrorHandler } from '../../errors/error-handler.js';
import { ToolContext } from '../../errors/types.js';
import { FreshBooksClientWrapper } from '../../client/index.js';

const InputSchema = AccountIdSchema.extend({
  ...PaginationSchema.shape,
});

/**
 * Tool definition for task_list
 */
export const taskListTool = {
  name: 'task_list',
  description: `List tasks from FreshBooks.

WHEN TO USE:
- User wants to see project tasks
- Need to find a task ID for time entry
- Browse available task categories
- Review task organization

REQUIRED INFO:
- accountId: FreshBooks account ID

OPTIONAL PARAMETERS:
- page: Page number for pagination (default: 1)
- perPage: Results per page (default: 30, max: 100)

RETURNS:
Array of tasks with:
- Task ID, name, description
- Billable status and rate
- Visibility state (active/archived)
- Pagination metadata

EXAMPLE PROMPTS:
- "Show me all tasks"
- "List project tasks"
- "What tasks can I assign time to?"
- "Get all billable tasks"

NOTE: Tasks can have alternate field names (name/tname, description/tdesc) in the API.`,

  inputSchema: InputSchema,
  outputSchema: TaskListOutputSchema,

  async execute(
    input: z.infer<typeof InputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof TaskListOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'task_list',
      async (input: z.infer<typeof InputSchema>, _context: ToolContext) => {
        const { accountId, page, perPage } = input;

        const result = await client.executeWithRetry('task_list', async (fbClient) => {
          const { PaginationQueryBuilder } = await import(
            '@freshbooks/api/dist/models/builders/index.js'
          );

          // Build pagination query
          const queryBuilders = [];
          if (page || perPage) {
            queryBuilders.push(new PaginationQueryBuilder().page(page ?? 1).perPage(perPage ?? 30));
          }

          // Call FreshBooks API
          const response = await fbClient.tasks.list(accountId, queryBuilders);

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        return {
          tasks: (result as any).tasks || [],
          pagination: (result as any).pages || {
            page: 1,
            pages: 1,
            total: (result as any).tasks?.length || 0,
            perPage: perPage ?? 30,
          },
        };
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};
