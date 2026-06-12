/**
 * Project Single Tool
 *
 * Get detailed information about a specific project by ID.
 */

import { z } from "zod";
import { ProjectSingleInputSchema, ProjectSingleOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/freshbooks-client.js";

/**
 * Tool definition for project_single
 */
export const projectSingleTool = {
  name: "project_single",
  description: `Get detailed information about a specific project by ID.

WHEN TO USE:
- User asks for details about a specific project
- User provides a project ID or name from a previous list
- Need full project information including rates and billing settings

REQUIRED INFO:
- Project ID (numeric)
- Account ID (get from context or user)

OPTIONAL INCLUDES:
- client: Include full client details
- services: Include associated service definitions
- group: Include project group information

EXAMPLE PROMPTS:
- "Show me details for project 12345"
- "Get information about the Website Redesign project"
- "What's the billing method for project 98765?"

RETURNS:
Project object: id, title, description, dueDate (ISO 8601), clientId, internal (bool),
budget, fixedPrice, rate, billingMethod (business_rate/project_rate/service_rate/team_member_rate),
projectType (fixed_price/hourly_rate), projectManagerId, active (bool), complete (bool),
loggedDuration (seconds), services[], billedAmount, billedStatus (unbilled/partial/billed),
retainerId, expenseMarkup, createdAt, updatedAt.`,

  inputSchema: ProjectSingleInputSchema,
  outputSchema: ProjectSingleOutputSchema,

  async execute(
    input: z.infer<typeof ProjectSingleInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ProjectSingleOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      "project_single",
      ProjectSingleInputSchema,
      async (input: z.infer<typeof ProjectSingleInputSchema>, _context: ToolContext) => {
        const { businessId, projectId } = input;

        // NOTE (C2): the input schema accepts `includes`, but the SDK's
        // projects.single(businessId, projectId) takes no query builders, so
        // includes cannot be forwarded — it is intentionally a no-op here.
        // Use project_list with `include` if related data is needed.

        // Execute the API call
        const result = await client.executeWithRetry(
          "project_single",
          async (fbClient) => {
            const response = await fbClient.projects.single(businessId, projectId);

            if (!response.ok) {
              throw response.error;
            }

            return response.data;
          }
        );

        // FreshBooks returns: { project: { ... } }
        const project = (result as { project?: unknown }).project ?? result;

        return project as z.infer<typeof ProjectSingleOutputSchema>;
      }
    );

    return handler(input, { businessId: input.businessId });
  },
};

/**
 * Wrapped handler for backward compatibility with tests
 */
export async function handleProjectSingle(
  input: z.infer<typeof ProjectSingleInputSchema>,
  context: { client: FreshBooksClientWrapper }
): Promise<z.infer<typeof ProjectSingleOutputSchema>> {
  return projectSingleTool.execute(input, context.client);
}
