/**
 * Project Delete Tool
 *
 * Delete a project from FreshBooks.
 * WARNING: This is a permanent operation.
 */

import { z } from "zod";
import { ProjectDeleteInputSchema, ProjectDeleteOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/freshbooks-client.js";

/**
 * Tool definition for project_delete
 */
export const projectDeleteTool = {
  name: "project_delete",
  description: `Delete a project from FreshBooks.

WARNING: This permanently deletes the project and cannot be undone.

WHEN TO USE:
- User wants to permanently remove a project
- User says "delete project", "remove project"
- Cleaning up test or duplicate projects

REQUIRED INFO:
- projectId: Which project to delete (numeric)
- accountId: FreshBooks account (get from context)

IMPORTANT WARNINGS:
- Deletion is permanent and cannot be undone
- Consider marking project inactive (active=false) instead for soft-delete
- Time entries associated with project may be affected
- Historical billing data will lose project reference

SAFER ALTERNATIVES:
- Use project_update with active=false to deactivate
- Use project_update with complete=true to mark done
- These preserve data and can be reversed

WHEN TO ACTUALLY DELETE:
- Test projects that were created by mistake
- Duplicate projects
- Projects with no time entries or billing history

EXAMPLE PROMPTS:
- "Delete project 12345" (use cautiously)
- "Remove the test project I just created"

BEFORE DELETING:
Recommend asking user "Are you sure?" and suggesting deactivation as alternative.
You might want to check if project has logged time first using project_single.

RETURNS:
Success confirmation with the deleted project ID.`,

  inputSchema: ProjectDeleteInputSchema,
  outputSchema: ProjectDeleteOutputSchema,

  async execute(
    input: z.infer<typeof ProjectDeleteInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ProjectDeleteOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      "project_delete",
      async (input: z.infer<typeof ProjectDeleteInputSchema>, _context: ToolContext) => {
        const { businessId, projectId } = input;

        // Execute the API call
        await client.executeWithRetry("project_delete", async (fbClient) => {
          const response = await fbClient.projects.delete(businessId, projectId);

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        return {
          success: true,
          projectId,
        };
      }
    );

    return handler(input, { businessId: input.businessId });
  },
};

/**
 * Wrapped handler for backward compatibility with tests
 */
export async function handleProjectDelete(
  input: z.infer<typeof ProjectDeleteInputSchema>,
  context: { client: FreshBooksClientWrapper }
): Promise<z.infer<typeof ProjectDeleteOutputSchema>> {
  return projectDeleteTool.execute(input, context.client);
}
