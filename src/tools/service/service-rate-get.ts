/**
 * Service Rate Get Tool
 *
 * Retrieve the billing rate for a service.
 */

import { z } from "zod";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Input schema for service_rate_get
 */
const ServiceRateGetInputSchema = z.object({
  businessId: z.number().int().positive().describe("FreshBooks business ID"),
  serviceId: z.number().int().positive().describe("Service ID"),
});

/**
 * Output schema for service_rate_get
 */
const ServiceRateGetOutputSchema = z.object({
  rate: z.string().describe("Rate amount as decimal string"),
  code: z.string().describe("Currency code (e.g., USD)"),
});

/**
 * Tool definition for service_rate_get
 */
export const serviceRateGetTool = {
  name: "service_rate_get",
  description: `Get the billing rate for a service in FreshBooks.

WHEN TO USE:
- Need to know the rate for a service
- Verify pricing before time entry
- Check current billing rates

REQUIRED INFO:
- Business ID
- Service ID

RETURNS:
Service rate details:
- rate: Amount as decimal string (e.g., "75.00")
- code: Currency code (e.g., "USD")

EXAMPLE PROMPTS:
- "What is the rate for service 123?"
- "Get the billing rate for Development service"
- "How much do we charge for service ID 456?"

NOTE: Rates can be different per service. Use service_rate_set to configure pricing.`,

  inputSchema: ServiceRateGetInputSchema,
  outputSchema: ServiceRateGetOutputSchema,

  async execute(
    input: z.infer<typeof ServiceRateGetInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof ServiceRateGetOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'service_rate_get',
      async (input: z.infer<typeof ServiceRateGetInputSchema>, _context: ToolContext) => {
        const { businessId, serviceId } = input;

        const result = await client.executeWithRetry('service_rate_get', async (fbClient) => {
          const response = await fbClient.services.rate.single(businessId, serviceId);

          if (!response.ok) {
            throw response.error;
          }

          return response.data;
        });

        return result as z.infer<typeof ServiceRateGetOutputSchema>;
      }
    );

    return handler(input, { businessId: input.businessId });
  },
};
