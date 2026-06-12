/**
 * Callback List Tool
 *
 * List webhooks/callbacks with pagination.
 */

import { z } from "zod";
import { CallbackListInputSchema, CallbackListOutputSchema } from "./schemas.js";
import { ErrorHandler } from "../../errors/error-handler.js";
import { ToolContext } from "../../errors/types.js";
import { FreshBooksClientWrapper } from "../../client/index.js";

/**
 * Tool definition for callback_list
 */
export const callbackListTool = {
  name: "callback_list",
  description: `List webhooks/callbacks from FreshBooks.

WHEN TO USE:
- User asks to "see webhooks", "list callbacks", "show webhook subscriptions"
- User wants to check what events they're subscribed to
- User needs to verify webhook setup

WHAT IT RETURNS:
Each callback includes:
- Event type being monitored (e.g., invoice.create, payment.create)
- Webhook endpoint URL
- Verification status
- Creation/update timestamps

PAGINATION:
- Use page/perPage for large result sets
- Default: 30 results per page
- Maximum: 100 results per page

EXAMPLE PROMPTS:
- "Show me all my webhooks"
- "List webhook subscriptions"
- "What events am I listening for?"

RETURNS:
Array of callbacks with fields: id, event (e.g., invoice.create), uri, verified (bool),
createdAt, updatedAt. Pagination: {page, pages, perPage, total}.`,

  inputSchema: CallbackListInputSchema,
  outputSchema: CallbackListOutputSchema,

  async execute(
    input: z.infer<typeof CallbackListInputSchema>,
    client: FreshBooksClientWrapper
  ): Promise<z.infer<typeof CallbackListOutputSchema>> {
    const handler = ErrorHandler.wrapHandler(
      'callback_list',
      CallbackListInputSchema,
      async (input: z.infer<typeof CallbackListInputSchema>, _context: ToolContext) => {
        const { accountId, page, perPage } = input;

        // The SDK's `callbacks.list` runs every callback's `updated_at` through
        // `transformDateResponse` (luxon `fromSQL(...).toJSDate()`). A single
        // callback with an unparseable `updated_at` yields an Invalid Date, and
        // downstream ISO serialization throws "Invalid time value" — taking down
        // the WHOLE list (live-confirmed, #70). We bypass the SDK transform with a
        // raw GET and guard each date ourselves so one bad webhook can't break the
        // page.
        const query: string[] = [];
        if (page !== undefined) query.push(`page=${encodeURIComponent(String(page))}`);
        if (perPage !== undefined) query.push(`per_page=${encodeURIComponent(String(perPage))}`);
        const queryString = query.length ? `?${query.join('&')}` : '';

        const result = await client.executeRawWithRetry(
          'GET',
          `/events/account/${accountId}/events/callbacks${queryString}`,
          undefined,
          'callback_list'
        );

        if (!result.ok) {
          throw result.error ?? new Error('Callback list failed');
        }

        // Events API returns { response: { result: { callbacks, page, pages, per_page, total } } }
        const apiResult = (result.data as any)?.response?.result ?? {};
        const rawCallbacks: any[] = Array.isArray(apiResult.callbacks) ? apiResult.callbacks : [];

        const callbacks = rawCallbacks.map((cb) => ({
          id: cb.callbackid,
          event: cb.event,
          uri: cb.uri,
          verified: cb.verified,
          // Pass dates through a guard: valid → ISO 8601, unparseable → raw string
          // (never throw). The events API emits SQL-style "YYYY-MM-DD HH:mm:ss".
          createdAt: safeIsoDate(cb.created_at),
          updatedAt: safeIsoDate(cb.updated_at),
        }));

        return {
          callbacks,
          pagination: {
            page: apiResult.page ?? 1,
            pages: apiResult.pages ?? 1,
            perPage: apiResult.per_page ?? perPage ?? 30,
            total: apiResult.total ?? callbacks.length,
          },
        };
      }
    );

    return handler(input, { accountId: input.accountId });
  },
};

/**
 * Convert a FreshBooks date string to ISO 8601, or pass it through unchanged if
 * it cannot be parsed. Never throws — this is the guard that prevents one bad
 * `updated_at` from crashing the entire callback list (#70).
 *
 * FreshBooks events API emits SQL-style "YYYY-MM-DD HH:mm:ss" (UTC). We treat a
 * bare SQL timestamp as UTC by appending "Z" before parsing.
 */
function safeIsoDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }

  // Normalize "YYYY-MM-DD HH:mm:ss" → "YYYY-MM-DDTHH:mm:ssZ" for Date parsing.
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? `${value.replace(' ', 'T')}Z`
    : value;

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    // Unparseable — return the original string rather than crashing.
    return value;
  }

  return parsed.toISOString();
}
