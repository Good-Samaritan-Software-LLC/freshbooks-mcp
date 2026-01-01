/**
 * Project Update Tool
 *
 * Update an existing project in FreshBooks.
 */

import { z } from "zod";
import { ProjectUpdateInputSchema, ProjectSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/freshbooks-client.js";

/**
 * Tool definition for project_update
 */
export const projectUpdateTool = {
  name: "project_update",
  description: `Update an existing project in FreshBooks.

WHEN TO USE:
- User wants to modify project details
- User says "update project", "change project", "mark project complete"
- Adjusting billing rates, due dates, or status

REQUIRED INFO:
- projectId: Which project to update (numeric)
- accountId: FreshBooks account (get from context)

UPDATABLE FIELDS:
- title: Change project name
- description: Update project description
- dueDate: Change completion deadline (ISO 8601)
- clientId: Reassign to different client
- billingMethod: Change how project is billed
- rate: Update hourly rate
- fixedPrice: Change fixed price amount
- budget: Adjust project budget
- active: Activate or deactivate project
- complete: Mark project as complete/incomplete
- internal: Change billable status

STATUS CHANGES:
- Set active=false to pause project (stops appearing in active lists)
- Set complete=true to mark project done
- Both can be combined for archival

EXAMPLE PROMPTS:
- "Mark project 12345 as complete"
- "Update project Website Redesign to increase rate to $150/hr"
- "Change project 98765 due date to next Friday"
- "Deactivate project Mobile App"

RETURNS:
Updated project with all current settings. Changes take effect immediately
for new time entries.`,

  inputSchema: ProjectUpdateInputSchema,
  outputSchema: ProjectSingleOutputSchema,

  async execute(
    input: z.infer<typeof ProjectUpdateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ProjectSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      "project_update",
      async (input: z.infer<typeof ProjectUpdateInputSchema>, _context: ToolContext) => {
        const { businessId, projectId, ...updates } = input;

        // Build update object for API (convert camelCase to snake_case)
        const project: Record<string, unknown> = {};

        if (updates.title !== undefined) project.title = updates.title;
        if (updates.clientId !== undefined) project.client_id = updates.clientId;
        if (updates.description !== undefined) project.description = updates.description;
        if (updates.dueDate !== undefined) project.due_date = updates.dueDate;
        if (updates.budget !== undefined) project.budget = updates.budget;
        if (updates.fixedPrice !== undefined) project.fixed_price = updates.fixedPrice;
        if (updates.rate !== undefined) project.rate = updates.rate;
        if (updates.billingMethod !== undefined) project.billing_method = updates.billingMethod;
        if (updates.projectType !== undefined) project.project_type = updates.projectType;
        if (updates.internal !== undefined) project.internal = updates.internal;
        if (updates.projectManagerId !== undefined) project.project_manager_id = updates.projectManagerId;
        if (updates.active !== undefined) project.active = updates.active;
        if (updates.complete !== undefined) project.complete = updates.complete;

        // Execute the API call
        const result = await client.executeWithRetry(
          "project_update",
          async (fbClient) => {
            const response = await fbClient.projects.update(project, businessId, projectId);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { project: { ... } }
        const updatedProject = (result as { project?: unknown }).project ?? result;

        return updatedProject as z.infer<typeof ProjectSingleOutputSchema>;
      }
    );

    return handler(input, { businessId: input.businessId });
  },
};

/**
 * Wrapped handler for backward compatibility with tests
 */
export async function handleProjectUpdate(
  input: z.infer<typeof ProjectUpdateInputSchema>,
  context: { client: FreshBooksClientWrapper }
): Promise<z.infer<typeof ProjectSingleOutputSchema>> {
  return projectUpdateTool.execute(input, context.client);
}
