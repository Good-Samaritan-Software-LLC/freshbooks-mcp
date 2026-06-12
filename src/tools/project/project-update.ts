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
Updated project: id, title, description, dueDate, clientId, internal, budget,
rate, billingMethod, projectType, active, complete, loggedDuration,
services[], billedAmount, billedStatus, updatedAt.`,

  inputSchema: ProjectUpdateInputSchema,
  outputSchema: ProjectSingleOutputSchema,

  async execute(
    input: z.infer<typeof ProjectUpdateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ProjectSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      "project_update",
      ProjectUpdateInputSchema,
      async (input: z.infer<typeof ProjectUpdateInputSchema>, _context: ToolContext) => {
        const { businessId, projectId, ...updates } = input;

        // Require at least one field to change (otherwise the round-trip is wasted
        // and the intent is ambiguous).
        const changedFields = Object.keys(updates).filter(
          (k) => updates[k as keyof typeof updates] !== undefined
        );
        if (changedFields.length === 0) {
          throw ErrorHandler.createValidationError(
            "No fields provided to update. Please specify at least one field to change.",
            { tool: "project_update", businessId, projectId }
          );
        }

        // Execute the API call
        const result = await client.executeWithRetry(
          "project_update",
          async (fbClient) => {
            // Read-modify-write: the Projects API 500s ("An internal error has
            // occurred", #70) on a partial PUT — it requires the full editable
            // representation. Fetch the current project, overlay the user's
            // changes, and send the complete object. (Mirrors expense_update.)
            const existingResponse = await fbClient.projects.single(businessId, projectId);

            if (!existingResponse.ok) {
              throw existingResponse.error;
            }

            // projects.single returns the SDK-parsed project directly (not wrapped).
            const existing = ((existingResponse.data as { project?: unknown }).project ??
              existingResponse.data) as Record<string, unknown>;

            // Seed the payload from the existing EDITABLE fields only. Read-only /
            // computed fields (sample, loggedDuration, billedAmount, billedStatus,
            // retainerId, expenseMarkup, group, services, timestamps) are
            // intentionally omitted — echoing them back is what triggers the 500.
            const project: Record<string, unknown> = {
              title: existing.title,
              description: existing.description,
              // The SDK parses due_date into a JS Date; the API wants "YYYY-MM-DD".
              dueDate: toApiDate(existing.dueDate),
              clientId: existing.clientId,
              internal: existing.internal,
              budget: existing.budget,
              fixedPrice: existing.fixedPrice,
              rate: existing.rate,
              billingMethod: existing.billingMethod,
              projectType: existing.projectType,
              projectManagerId: existing.projectManagerId,
              active: existing.active,
              complete: existing.complete,
            };

            // Overlay only the fields the user provided.
            if (updates.title !== undefined) project.title = updates.title;
            if (updates.clientId !== undefined) project.clientId = updates.clientId;
            if (updates.description !== undefined) project.description = updates.description;
            if (updates.dueDate !== undefined) project.dueDate = updates.dueDate;
            if (updates.budget !== undefined) project.budget = updates.budget;
            if (updates.fixedPrice !== undefined) project.fixedPrice = updates.fixedPrice;
            if (updates.rate !== undefined) project.rate = updates.rate;
            if (updates.billingMethod !== undefined) project.billingMethod = updates.billingMethod;
            if (updates.projectType !== undefined) project.projectType = updates.projectType;
            if (updates.internal !== undefined) project.internal = updates.internal;
            if (updates.projectManagerId !== undefined) project.projectManagerId = updates.projectManagerId;
            if (updates.active !== undefined) project.active = updates.active;
            if (updates.complete !== undefined) project.complete = updates.complete;

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
 * Coerce a project due_date (which the SDK parses into a JS Date) back to the
 * "YYYY-MM-DD" string the Projects API expects. Passes through strings/null and
 * never throws on an invalid value (returns null rather than crash the update).
 */
function toApiDate(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    // Already "YYYY-MM-DD" — keep as-is; otherwise take the date portion.
    return value.slice(0, 10);
  }
  return null;
}

/**
 * Wrapped handler for backward compatibility with tests
 */
export async function handleProjectUpdate(
  input: z.infer<typeof ProjectUpdateInputSchema>,
  context: { client: FreshBooksClientWrapper }
): Promise<z.infer<typeof ProjectSingleOutputSchema>> {
  return projectUpdateTool.execute(input, context.client);
}
