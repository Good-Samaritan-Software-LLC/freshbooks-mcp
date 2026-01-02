/**
 * Project Create Tool
 *
 * Create a new project in FreshBooks.
 */

import { z } from "zod";
import { ProjectCreateInputSchema, ProjectSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/freshbooks-client.js";

/**
 * Tool definition for project_create
 */
export const projectCreateTool = {
  name: "project_create",
  description: `Create a new project in FreshBooks.

WHEN TO USE:
- User wants to create a new project
- User says "start a project", "create project", "new project"
- Setting up work tracking for a new client or initiative

REQUIRED INFO:
- title: Project name (user must provide)
- accountId: FreshBooks account (get from context)

OPTIONAL BUT HELPFUL:
- clientId: Associate with a client for billing
- description: What the project is about
- dueDate: When project should be completed (ISO 8601)
- billingMethod: How to bill (project_rate, service_rate, flat_rate, team_member_rate)
- projectType: fixed_price or hourly_rate
- rate: Hourly rate if hourly_rate type
- fixedPrice: Total price if fixed_price type
- budget: Project budget amount
- internal: Set to true for non-billable internal work

BILLING METHODS:
- project_rate: Bill at project-level hourly rate
- service_rate: Bill based on service assigned to time entries
- flat_rate: Fixed price project
- team_member_rate: Bill at individual team member rates

EXAMPLE PROMPTS:
- "Create a new project called Website Redesign"
- "Start a project for client ABC123: Mobile App Development"
- "New internal project for training, not billable"

RETURNS:
Created project with ID and all configured settings. Use this ID for time tracking.`,

  inputSchema: ProjectCreateInputSchema,
  outputSchema: ProjectSingleOutputSchema,

  async execute(
    input: z.infer<typeof ProjectCreateInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ProjectSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      "project_create",
      async (input: z.infer<typeof ProjectCreateInputSchema>, _context: ToolContext) => {
        const { businessId, ...projectData } = input;

        // Build project object using camelCase properties
        // The FreshBooks SDK's transformProjectRequest() will convert to API format
        const project: Record<string, unknown> = {
          title: projectData.title,
        };

        // Add optional fields if provided
        if (projectData.clientId !== undefined) project.clientId = projectData.clientId;
        if (projectData.description !== undefined) project.description = projectData.description;
        if (projectData.dueDate !== undefined) project.dueDate = projectData.dueDate;
        if (projectData.budget !== undefined) project.budget = projectData.budget;
        if (projectData.fixedPrice !== undefined) project.fixedPrice = projectData.fixedPrice;
        if (projectData.rate !== undefined) project.rate = projectData.rate;
        if (projectData.billingMethod !== undefined) project.billingMethod = projectData.billingMethod;
        if (projectData.projectType !== undefined) project.projectType = projectData.projectType;
        if (projectData.internal !== undefined) project.internal = projectData.internal;
        if (projectData.projectManagerId !== undefined) project.projectManagerId = projectData.projectManagerId;

        // Execute the API call
        const result = await client.executeWithRetry(
          "project_create",
          async (fbClient) => {
            const response = await fbClient.projects.create(project, businessId);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { project: { ... } }
        const createdProject = (result as { project?: unknown }).project ?? result;

        return createdProject as z.infer<typeof ProjectSingleOutputSchema>;
      }
    );

    return handler(input, { businessId: input.businessId });
  },
};

/**
 * Wrapped handler for backward compatibility with tests
 */
export async function handleProjectCreate(
  input: z.infer<typeof ProjectCreateInputSchema>,
  context: { client: FreshBooksClientWrapper }
): Promise<z.infer<typeof ProjectSingleOutputSchema>> {
  return projectCreateTool.execute(input, context.client);
}
