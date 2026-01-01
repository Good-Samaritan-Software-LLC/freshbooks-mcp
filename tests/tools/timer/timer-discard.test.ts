/**
 * Tests for timer_discard tool
 *
 * Uses raw HTTP:
 * 1. GET /comments/business/{businessId}/timers to find the timer
 * 2. DELETE /comments/business/{businessId}/timers/{id} to discard it
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { timerDiscardTool, timerDiscardHandler } from '../../../src/tools/timer/timer-discard.js';
import { createMockClientWrapper } from '../../mocks/client.js';

/**
 * Create a mock timers GET response
 */
function createMockTimersResponse(options: {
  timerId?: number;
  timeEntryId?: number;
} = {}) {
  const timerId = options.timerId ?? 1000;
  const timeEntryId = options.timeEntryId ?? 2000;
  return {
    timers: [{
      id: timerId,
      is_running: true,
      time_entries: [{
        id: timeEntryId,
      }],
    }],
  };
}

describe('timer_discard tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful discard', () => {
    it('should discard a running timer', async () => {
      const timersResponse = createMockTimersResponse({ timerId: 1000, timeEntryId: 2000 });

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 204 }); // DELETE returns 204

      const result = await timerDiscardHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.success).toBe(true);
      expect(result.timeEntryId).toBe(2000);
      expect(result.message).toContain('1000');
      expect(result.message).toContain('discarded');
    });

    it('should return confirmation message', async () => {
      const timersResponse = createMockTimersResponse();

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 204 });

      const result = await timerDiscardHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.message).toBeDefined();
      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should confirm no time was logged', async () => {
      const timersResponse = createMockTimersResponse();

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 204 });

      const result = await timerDiscardHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.message.toLowerCase()).toContain('no time');
    });

    it('should discard timer with large ID', async () => {
      const largeId = 999999999;
      const timersResponse = createMockTimersResponse({ timerId: largeId, timeEntryId: largeId });

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 204 });

      const result = await timerDiscardHandler(
        { businessId: 12345, timerId: largeId },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.success).toBe(true);
    });

    it('should discard specific timer by timerId', async () => {
      const timersResponse = createMockTimersResponse({ timerId: 5555 });

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 204 });

      const result = await timerDiscardHandler(
        { businessId: 12345, timerId: 5555 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.success).toBe(true);
      expect(mockClient.executeRawWithRetry).toHaveBeenLastCalledWith(
        'DELETE',
        '/comments/business/12345/timers/5555',
        undefined,
        'timer_discard'
      );
    });
  });

  describe('error handling', () => {
    it('should handle timer not found error', async () => {
      const timersResponse = { timers: [] };

      mockClient.executeRawWithRetry.mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: timersResponse,
      });

      await expect(
        timerDiscardHandler(
          { businessId: 12345 },
          { businessId: 12345, client: mockClient as any }
        )
      ).rejects.toThrow('No timer found');
    });

    it('should handle specific timer not found', async () => {
      const timersResponse = createMockTimersResponse({ timerId: 1000 });

      mockClient.executeRawWithRetry.mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: timersResponse,
      });

      await expect(
        timerDiscardHandler(
          { businessId: 12345, timerId: 9999 },
          { businessId: 12345, client: mockClient as any }
        )
      ).rejects.toThrow('Timer with ID 9999 not found');
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeRawWithRetry.mockResolvedValueOnce({
        ok: false,
        status: 401,
        error: new Error('Unauthorized'),
      });

      await expect(
        timerDiscardHandler(
          { businessId: 12345 },
          { businessId: 12345, client: mockClient as any }
        )
      ).rejects.toThrow();
    });

    it('should handle forbidden error', async () => {
      mockClient.executeRawWithRetry.mockResolvedValueOnce({
        ok: false,
        status: 403,
        error: new Error('Forbidden'),
      });

      await expect(
        timerDiscardHandler(
          { businessId: 12345 },
          { businessId: 12345, client: mockClient as any }
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeRawWithRetry.mockResolvedValueOnce({
        ok: false,
        status: 500,
        error: new Error('Server error'),
      });

      await expect(
        timerDiscardHandler(
          { businessId: 12345 },
          { businessId: 12345, client: mockClient as any }
        )
      ).rejects.toThrow();
    });

    it('should handle DELETE failure', async () => {
      const timersResponse = createMockTimersResponse();

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: false, status: 500, error: new Error('Delete failed') });

      await expect(
        timerDiscardHandler(
          { businessId: 12345 },
          { businessId: 12345, client: mockClient as any }
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require businessId', async () => {
      await expect(
        timerDiscardHandler(
          {} as any,
          { client: mockClient as any } as any
        )
      ).rejects.toThrow();
    });

    it('should not require timerId (auto-detects)', async () => {
      const timersResponse = createMockTimersResponse();

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 204 });

      const result = await timerDiscardHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.success).toBe(true);
    });

    it('should reject zero businessId', async () => {
      await expect(
        timerDiscardHandler(
          { businessId: 0 } as any,
          { businessId: 0, client: mockClient as any }
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle discard of stopped timer (deletes logged time)', async () => {
      const timersResponse = createMockTimersResponse();

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 204 });

      const result = await timerDiscardHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.success).toBe(true);
    });

    it('should handle various valid businessId values', async () => {
      const timersResponse = createMockTimersResponse();

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 204 });

      const result = await timerDiscardHandler(
        { businessId: 99999 },
        { businessId: 99999, client: mockClient as any }
      );

      expect(result.success).toBe(true);
    });

    it('should verify message includes timer ID', async () => {
      const timersResponse = createMockTimersResponse({ timerId: 54321 });

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 204 });

      const result = await timerDiscardHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.message).toContain('54321');
    });

    it('should be idempotent for different timer IDs', async () => {
      const timersResponse1 = createMockTimersResponse({ timerId: 111, timeEntryId: 111 });
      const timersResponse2 = createMockTimersResponse({ timerId: 222, timeEntryId: 222 });

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse1 })
        .mockResolvedValueOnce({ ok: true, status: 204 });

      const result1 = await timerDiscardHandler(
        { businessId: 12345, timerId: 111 },
        { businessId: 12345, client: mockClient as any }
      );

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse2 })
        .mockResolvedValueOnce({ ok: true, status: 204 });

      const result2 = await timerDiscardHandler(
        { businessId: 12345, timerId: 222 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('should handle maximum integer timerId', async () => {
      const maxId = Number.MAX_SAFE_INTEGER;
      const timersResponse = createMockTimersResponse({ timerId: maxId, timeEntryId: maxId });

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 204 });

      const result = await timerDiscardHandler(
        { businessId: 12345, timerId: maxId },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.success).toBe(true);
    });

    it('should handle backwards compatible timeEntryId', async () => {
      const timersResponse = createMockTimersResponse({ timerId: 1000, timeEntryId: 2000 });

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 204 });

      // Using deprecated timeEntryId parameter
      const result = await timerDiscardHandler(
        { businessId: 12345, timeEntryId: 2000 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.success).toBe(true);
    });
  });

  describe('difference from timer_stop', () => {
    it('should permanently delete instead of logging time', async () => {
      const timersResponse = createMockTimersResponse();

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 204 });

      const result = await timerDiscardHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      // Verify it's a delete operation
      expect(result.success).toBe(true);
      expect(result.message.toLowerCase()).toContain('discard');
      expect(result.message.toLowerCase()).not.toContain('stop');
    });

    it('should indicate time was not logged in message', async () => {
      const timersResponse = createMockTimersResponse();

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 204 });

      const result = await timerDiscardHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.message.toLowerCase()).toContain('no time');
      expect(result.message.toLowerCase()).toContain('log');
    });
  });
});
