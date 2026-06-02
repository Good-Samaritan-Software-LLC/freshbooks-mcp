/**
 * Tests for callback_list tool
 *
 * callback_list bypasses the SDK (whose date transform crashes the whole list on
 * a single unparseable `updated_at`, #70) and reads the raw events API directly
 * via executeRawWithRetry, guarding each date itself.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { callbackListTool } from '../../../src/tools/callback/callback-list.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  createRawCallback,
  mockCallbackListRawResponse,
} from '../../mocks/responses/callback.js';

/** Build a raw list response of `count` callbacks with rotating event types. */
function rawList(count: number, page = 1, perPage = 30) {
  const callbacks = Array.from({ length: count }, (_, i) =>
    createRawCallback({
      callbackid: 12345 + i,
      event:
        i % 3 === 0 ? 'invoice.create' : i % 3 === 1 ? 'payment.create' : 'time_entry.create',
      uri: `https://example.com/webhooks/${12345 + i}`,
      verified: i % 2 === 0,
    })
  );
  return mockCallbackListRawResponse(callbacks, {
    page,
    pages: Math.max(1, Math.ceil(count / perPage)),
    per_page: perPage,
    total: count,
  });
}

describe('callback_list tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return callbacks with default pagination', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(rawList(10));

      const result = await callbackListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.callbacks).toHaveLength(10);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.perPage).toBe(30);
      expect(result.pagination.total).toBe(10);
    });

    it('should return callbacks with custom pagination', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(rawList(5, 2, 5));

      const result = await callbackListTool.execute(
        { accountId: 'ABC123', page: 2, perPage: 5 },
        mockClient as any
      );

      expect(result.callbacks).toHaveLength(5);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.perPage).toBe(5);
    });

    it('should pass pagination params in the query string', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(rawList(5, 2, 5));

      await callbackListTool.execute(
        { accountId: 'ABC123', page: 2, perPage: 5 },
        mockClient as any
      );

      const [method, path] = mockClient.executeRawWithRetry.mock.calls[0];
      expect(method).toBe('GET');
      expect(path).toBe('/events/account/ABC123/events/callbacks?page=2&per_page=5');
    });

    it('should map raw wire fields (callbackid -> id, updated_at -> ISO)', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(
        mockCallbackListRawResponse([
          createRawCallback({ callbackid: 777, updated_at: '2024-03-01 12:30:00' }),
        ])
      );

      const result = await callbackListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.callbacks[0].id).toBe(777);
      expect(result.callbacks[0].updatedAt).toBe('2024-03-01T12:30:00.000Z');
    });

    it('should return empty array when no callbacks exist', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(
        mockCallbackListRawResponse([], { total: 0 })
      );

      const result = await callbackListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.callbacks).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should return callbacks with verification status', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(rawList(3));

      const result = await callbackListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.callbacks).toHaveLength(3);
      expect(result.callbacks[0]).toHaveProperty('verified');
      expect(result.callbacks[0]).toHaveProperty('event');
      expect(result.callbacks[0]).toHaveProperty('uri');
    });

    it('should handle maximum perPage value', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(rawList(100, 1, 100));

      const result = await callbackListTool.execute(
        { accountId: 'ABC123', perPage: 100 },
        mockClient as any
      );

      expect(result.callbacks).toHaveLength(100);
      expect(result.pagination.perPage).toBe(100);
    });
  });

  describe('date guarding (#70 regression)', () => {
    it('should not crash when a callback has an unparseable updated_at', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(
        mockCallbackListRawResponse([
          createRawCallback({ callbackid: 1, updated_at: '2024-01-15 10:00:00' }),
          createRawCallback({ callbackid: 2, updated_at: 'not-a-real-date' }),
          createRawCallback({ callbackid: 3, updated_at: '0000-00-00 00:00:00' }),
        ])
      );

      const result = await callbackListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      // The whole list survives; valid date is normalized, bad ones pass through raw.
      expect(result.callbacks).toHaveLength(3);
      expect(result.callbacks[0].updatedAt).toBe('2024-01-15T10:00:00.000Z');
      expect(result.callbacks[1].updatedAt).toBe('not-a-real-date');
      expect(result.callbacks[2].updatedAt).toBe('0000-00-00 00:00:00');
    });

    it('should yield undefined updatedAt when the field is missing', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(
        mockCallbackListRawResponse([createRawCallback({ updated_at: null })])
      );

      const result = await callbackListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.callbacks[0].updatedAt).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should throw when the raw request fails', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: false,
        status: 401,
        error: new Error('HTTP 401: unauthorized'),
      });

      await expect(
        callbackListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should throw a default error when no error is provided', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue({ ok: false, status: 500 });

      await expect(
        callbackListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow('Callback list failed');
    });

    it('should propagate a rejected raw request', async () => {
      mockClient.executeRawWithRetry.mockRejectedValueOnce(new Error('network timeout'));

      await expect(
        callbackListTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        callbackListTool.execute({} as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject invalid page number', async () => {
      await expect(
        callbackListTool.execute(
          { accountId: 'ABC123', page: 0 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject perPage exceeding maximum', async () => {
      await expect(
        callbackListTool.execute(
          { accountId: 'ABC123', perPage: 101 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject negative page number', async () => {
      await expect(
        callbackListTool.execute(
          { accountId: 'ABC123', page: -1 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject negative perPage', async () => {
      await expect(
        callbackListTool.execute(
          { accountId: 'ABC123', perPage: -5 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle request beyond last page', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(
        mockCallbackListRawResponse([], { page: 999, total: 0 })
      );

      const result = await callbackListTool.execute(
        { accountId: 'ABC123', page: 999 },
        mockClient as any
      );

      expect(result.callbacks).toHaveLength(0);
    });

    it('should handle callbacks with various event types', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue(rawList(5));

      const result = await callbackListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.callbacks).toHaveLength(5);
      const eventTypes = result.callbacks.map((cb: any) => cb.event);
      expect(eventTypes.length).toBe(5);
    });

    it('should handle callbacks with long URIs', async () => {
      const longUri =
        'https://example.com/very/long/path/to/webhook/endpoint/that/handles/events';
      mockClient.executeRawWithRetry.mockResolvedValue(
        mockCallbackListRawResponse([createRawCallback({ uri: longUri })])
      );

      const result = await callbackListTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.callbacks[0].uri).toContain('very/long/path');
    });
  });
});
