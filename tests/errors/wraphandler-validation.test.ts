/**
 * Tests for ErrorHandler.wrapHandler boundary input validation.
 *
 * wrapHandler validates the handler's input against the tool's Zod inputSchema
 * BEFORE the handler runs — applying defaults, stripping unknown keys, and
 * rejecting invalid input as a normalized MCP error. This is the defense-in-depth
 * guarantee that makes tools correct regardless of whether the host validated.
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { ErrorHandler } from '../../src/errors/error-handler.js';
import type { ToolContext } from '../../src/errors/types.js';

const ctx: ToolContext = { accountId: 'ABC123' };

describe('ErrorHandler.wrapHandler input validation', () => {
  it('applies schema defaults before the handler runs', async () => {
    const schema = z.object({
      accountId: z.string(),
      currencyCode: z.string().default('USD'),
    });
    let seen: unknown;
    const handler = ErrorHandler.wrapHandler('t', schema, async (input) => {
      seen = input;
      return input;
    });

    await handler({ accountId: 'ABC123' } as any, ctx);

    expect((seen as any).currencyCode).toBe('USD');
  });

  it('strips unknown keys before the handler runs', async () => {
    const schema = z.object({ accountId: z.string() });
    let seen: any;
    const handler = ErrorHandler.wrapHandler('t', schema, async (input) => {
      seen = input;
      return input;
    });

    await handler({ accountId: 'ABC123', injected: 'evil' } as any, ctx);

    expect(seen.injected).toBeUndefined();
    expect(seen.accountId).toBe('ABC123');
  });

  it('rejects schema-invalid input as a normalized validation error', async () => {
    const schema = z.object({ businessId: z.number().int().positive() });
    const handler = ErrorHandler.wrapHandler('t', schema, async (input) => input);

    // businessId missing -> ZodError -> normalized MCP INVALID_PARAMS error.
    await expect(handler({} as any, ctx)).rejects.toMatchObject({
      code: -32602, // MCPErrorCode.INVALID_PARAMS
    });
  });

  it('does not run the handler when validation fails', async () => {
    const schema = z.object({ accountId: z.string() });
    let ran = false;
    const handler = ErrorHandler.wrapHandler('t', schema, async (input) => {
      ran = true;
      return input;
    });

    await expect(handler({ accountId: 123 } as any, ctx)).rejects.toBeDefined();
    expect(ran).toBe(false);
  });

  it('passes validated input through to a successful handler', async () => {
    const schema = z.object({ accountId: z.string(), page: z.number().default(1) });
    const handler = ErrorHandler.wrapHandler('t', schema, async (input: any) => ({
      echoed: input,
    }));

    const result = (await handler({ accountId: 'ABC123' } as any, ctx)) as any;

    expect(result.echoed).toEqual({ accountId: 'ABC123', page: 1 });
  });
});
