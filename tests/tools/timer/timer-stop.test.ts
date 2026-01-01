/**
 * Tests for timer_stop tool
 *
 * Uses raw HTTP:
 * 1. GET /comments/business/{businessId}/timers to find the timer
 * 2. PUT /comments/business/{businessId}/timers/{id} to stop it
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { timerStopTool, timerStopHandler } from '../../../src/tools/timer/timer-stop.js';
import { createMockClientWrapper } from '../../mocks/client.js';

/**
 * Create a mock timers GET response
 */
function createMockTimersResponse(options: {
  timerId?: number;
  timeEntryId?: number;
  duration?: number | null;
  note?: string | null;
  projectId?: number | null;
  clientId?: number | null;
  billable?: boolean;
  isRunning?: boolean;
} = {}) {
  const timerId = options.timerId ?? 1000;
  const timeEntryId = options.timeEntryId ?? 2000;
  return {
    timers: [{
      id: timerId,
      is_running: options.isRunning ?? true,
      time_entries: [{
        id: timeEntryId,
        is_logged: false,
        started_at: new Date(Date.now() - 3600000).toISOString(),
        created_at: new Date().toISOString(),
        client_id: options.clientId ?? null,
        project_id: options.projectId ?? null,
        task_id: null,
        service_id: null,
        note: options.note ?? null,
        active: true,
        billable: options.billable ?? true,
        billed: false,
        internal: false,
        duration: options.duration ?? null,
      }],
    }],
  };
}

describe('timer_stop tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful timer stop', () => {
    it('should stop a running timer', async () => {
      const timersResponse = createMockTimersResponse({ timerId: 1000, timeEntryId: 2000 });

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 200, data: {} });

      const result = await timerStopHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.active).toBe(false);
      expect(result.isLogged).toBe(true);
      expect(result.timerId).toBe(1000);
    });

    it('should stop timer and update note', async () => {
      const timersResponse = createMockTimersResponse({ note: 'Original note' });

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 200, data: {} });

      const result = await timerStopHandler(
        { businessId: 12345, note: 'Updated note' },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.note).toBe('Updated note');
      expect(mockClient.executeRawWithRetry).toHaveBeenCalledTimes(2);
    });

    it('should stop timer with auto-calculated duration', async () => {
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      const timersResponse = createMockTimersResponse({ duration: null });
      timersResponse.timers[0].time_entries[0].started_at = oneHourAgo;

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 200, data: {} });

      const result = await timerStopHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      // Duration should be calculated (approximately 3600 seconds)
      expect(result.duration).toBeGreaterThan(3500);
      expect(result.duration).toBeLessThan(3700);
    });

    it('should preserve other timer fields when stopping', async () => {
      const timersResponse = createMockTimersResponse({
        projectId: 100,
        clientId: 200,
        billable: true,
        note: 'Previous note',
      });

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 200, data: {} });

      const result = await timerStopHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.projectId).toBe(100);
      expect(result.clientId).toBe(200);
      expect(result.billable).toBe(true);
      expect(result.note).toBe('Previous note');
    });

    it('should handle stopping timer with very long duration', async () => {
      const sevenDaysAgo = new Date(Date.now() - 86400000 * 7).toISOString();
      const timersResponse = createMockTimersResponse({ duration: null });
      timersResponse.timers[0].time_entries[0].started_at = sevenDaysAgo;

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 200, data: {} });

      const result = await timerStopHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      // Duration should be approximately 7 days in seconds
      expect(result.duration).toBeGreaterThan(86400 * 6);
    });

    it('should stop timer by timerId when provided', async () => {
      const timersResponse = createMockTimersResponse({ timerId: 5555 });

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 200, data: {} });

      const result = await timerStopHandler(
        { businessId: 12345, timerId: 5555 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.timerId).toBe(5555);
      expect(mockClient.executeRawWithRetry).toHaveBeenLastCalledWith(
        'PUT',
        '/comments/business/12345/timers/5555',
        expect.any(Object),
        'timer_stop'
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
        timerStopHandler(
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
        timerStopHandler(
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
        timerStopHandler(
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
        timerStopHandler(
          { businessId: 12345 },
          { businessId: 12345, client: mockClient as any }
        )
      ).rejects.toThrow();
    });

    it('should handle PUT failure', async () => {
      const timersResponse = createMockTimersResponse();

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: false, status: 500, error: new Error('Failed to stop') });

      await expect(
        timerStopHandler(
          { businessId: 12345 },
          { businessId: 12345, client: mockClient as any }
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require businessId', async () => {
      await expect(
        timerStopHandler(
          {} as any,
          { client: mockClient as any } as any
        )
      ).rejects.toThrow();
    });

    it('should not require timerId (auto-detects)', async () => {
      const timersResponse = createMockTimersResponse();

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 200, data: {} });

      // Should not throw - timerId is optional
      const result = await timerStopHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result).toBeDefined();
    });

    it('should reject zero businessId', async () => {
      await expect(
        timerStopHandler(
          { businessId: 0 } as any,
          { businessId: 0, client: mockClient as any }
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty note update', async () => {
      const timersResponse = createMockTimersResponse({ note: 'Original' });

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 200, data: {} });

      const result = await timerStopHandler(
        { businessId: 12345, note: '' },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.note).toBe('');
    });

    it('should handle unicode characters in note', async () => {
      const unicodeNote = 'テスト 🎉 completed';
      const timersResponse = createMockTimersResponse();

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 200, data: {} });

      const result = await timerStopHandler(
        { businessId: 12345, note: unicodeNote },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.note).toBe(unicodeNote);
    });

    it('should handle timer with logged duration segments', async () => {
      // Timer with some already-logged segments
      const timersResponse = {
        timers: [{
          id: 1000,
          is_running: true,
          time_entries: [
            {
              id: 2000,
              is_logged: false,
              started_at: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
              created_at: new Date().toISOString(),
              client_id: null,
              project_id: null,
              task_id: null,
              service_id: null,
              note: null,
              active: true,
              billable: true,
              billed: false,
              internal: false,
              duration: null, // Currently running segment
            },
            {
              id: 2001,
              is_logged: false,
              started_at: new Date(Date.now() - 7200000).toISOString(),
              created_at: new Date().toISOString(),
              client_id: null,
              project_id: null,
              task_id: null,
              service_id: null,
              note: null,
              active: false,
              billable: true,
              billed: false,
              internal: false,
              duration: 1800, // 30 mins previously logged
            },
          ],
        }],
      };

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 200, data: {} });

      const result = await timerStopHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      // Total should include both segments
      expect(result.duration).toBeGreaterThan(3000); // At least 50 mins
    });

    it('should handle very large timerId', async () => {
      const largeId = 999999999;
      const timersResponse = createMockTimersResponse({ timerId: largeId });

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 200, data: {} });

      const result = await timerStopHandler(
        { businessId: 12345, timerId: largeId },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.timerId).toBe(largeId);
    });

    it('should handle backwards compatible timeEntryId', async () => {
      const timersResponse = createMockTimersResponse({ timerId: 1000, timeEntryId: 2000 });

      mockClient.executeRawWithRetry
        .mockResolvedValueOnce({ ok: true, status: 200, data: timersResponse })
        .mockResolvedValueOnce({ ok: true, status: 200, data: {} });

      // Using deprecated timeEntryId parameter
      const result = await timerStopHandler(
        { businessId: 12345, timeEntryId: 2000 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.timerId).toBe(1000);
    });
  });
});
