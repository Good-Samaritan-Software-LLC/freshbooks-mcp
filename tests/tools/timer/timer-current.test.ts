/**
 * Tests for timer_current tool
 *
 * Uses raw HTTP to GET /comments/business/{businessId}/timers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { timerCurrentTool, timerCurrentHandler } from '../../../src/tools/timer/timer-current.js';
import { createMockClientWrapper } from '../../mocks/client.js';

/**
 * Create a mock timer response matching the raw API format
 */
function createMockTimerApiResponse(count: number) {
  const timers = [];
  for (let i = 0; i < count; i++) {
    timers.push({
      id: 1000 + i,
      is_running: true,
      time_entries: [{
        id: 2000 + i,
        is_logged: false,
        started_at: new Date(Date.now() - 3600000).toISOString(),
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
        duration: null, // null when running
      }],
    });
  }
  return { timers };
}

describe('timer_current tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return active timer when one is running', async () => {
      const apiResponse = createMockTimerApiResponse(1);
      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerCurrentHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.count).toBe(1);
      expect(result.activeTimers).toHaveLength(1);
      expect(result.activeTimers[0].active).toBe(true);
      expect(result.activeTimers[0].isLogged).toBe(false);
    });

    it('should return empty when no timer is running', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: { timers: [] },
      });

      const result = await timerCurrentHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.count).toBe(0);
      expect(result.activeTimers).toHaveLength(0);
    });

    it('should return timer with project details', async () => {
      const apiResponse = createMockTimerApiResponse(1);
      apiResponse.timers[0].time_entries[0].project_id = 100;
      apiResponse.timers[0].time_entries[0].note = 'Working on feature X';

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerCurrentHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.activeTimers[0].projectId).toBe(100);
      expect(result.activeTimers[0].note).toBe('Working on feature X');
    });

    it('should return timer with client details', async () => {
      const apiResponse = createMockTimerApiResponse(1);
      apiResponse.timers[0].time_entries[0].client_id = 200;

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerCurrentHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.activeTimers[0].clientId).toBe(200);
    });

    it('should return timer with startedAt timestamp', async () => {
      const startTime = new Date(Date.now() - 3600000).toISOString();
      const apiResponse = createMockTimerApiResponse(1);
      apiResponse.timers[0].time_entries[0].started_at = startTime;

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerCurrentHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.activeTimers[0].startedAt).toBe(startTime);
    });

    it('should include timer object with isRunning flag', async () => {
      const apiResponse = createMockTimerApiResponse(1);

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerCurrentHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.activeTimers[0].timer).toBeDefined();
      expect(result.activeTimers[0].timer?.isRunning).toBe(true);
    });

    it('should include billable status', async () => {
      const apiResponse = createMockTimerApiResponse(1);
      apiResponse.timers[0].time_entries[0].billable = true;

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerCurrentHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.activeTimers[0].billable).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: false,
        status: 401,
        error: new Error('Unauthorized'),
      });

      await expect(
        timerCurrentHandler(
          { businessId: 12345 },
          { businessId: 12345, client: mockClient as any }
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: false,
        status: 500,
        error: new Error('Server error'),
      });

      await expect(
        timerCurrentHandler(
          { businessId: 12345 },
          { businessId: 12345, client: mockClient as any }
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require businessId', async () => {
      await expect(
        timerCurrentHandler({} as any, { client: mockClient as any } as any)
      ).rejects.toThrow();
    });

    it('should reject zero businessId', async () => {
      await expect(
        timerCurrentHandler(
          { businessId: 0 } as any,
          { businessId: 0, client: mockClient as any }
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle multiple concurrent timers (rare case)', async () => {
      const apiResponse = createMockTimerApiResponse(2);

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerCurrentHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.count).toBe(2);
      expect(result.activeTimers).toHaveLength(2);
      expect(result.activeTimers[0].active).toBe(true);
      expect(result.activeTimers[1].active).toBe(true);
    });

    it('should handle timer with null optional fields', async () => {
      const apiResponse = createMockTimerApiResponse(1);
      apiResponse.timers[0].time_entries[0].project_id = null;
      apiResponse.timers[0].time_entries[0].client_id = null;
      apiResponse.timers[0].time_entries[0].note = null;

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerCurrentHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.activeTimers[0].projectId).toBeNull();
      expect(result.activeTimers[0].clientId).toBeNull();
      expect(result.activeTimers[0].note).toBeNull();
    });

    it('should handle timer with unicode in note', async () => {
      const unicodeNote = '日本語作業 🎉 testing';
      const apiResponse = createMockTimerApiResponse(1);
      apiResponse.timers[0].time_entries[0].note = unicodeNote;

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerCurrentHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.activeTimers[0].note).toBe(unicodeNote);
    });

    it('should handle timer started very recently (< 1 second)', async () => {
      const justNow = new Date().toISOString();
      const apiResponse = createMockTimerApiResponse(1);
      apiResponse.timers[0].time_entries[0].started_at = justNow;
      apiResponse.timers[0].time_entries[0].duration = null;

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerCurrentHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      // Duration is calculated for running timers
      expect(result.activeTimers[0].active).toBe(true);
    });

    it('should handle timer running for very long time', async () => {
      const longAgo = new Date(Date.now() - 86400000 * 7).toISOString();
      const apiResponse = createMockTimerApiResponse(1);
      apiResponse.timers[0].time_entries[0].started_at = longAgo;

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerCurrentHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      // Duration is calculated based on started_at
      expect(result.activeTimers[0].active).toBe(true);
    });

    it('should return consistent count with array length', async () => {
      const apiResponse = createMockTimerApiResponse(3);

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerCurrentHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.count).toBe(result.activeTimers.length);
      expect(result.count).toBe(3);
    });

    it('should handle timer with all optional associations', async () => {
      const apiResponse = createMockTimerApiResponse(1);
      apiResponse.timers[0].time_entries[0].project_id = 100;
      apiResponse.timers[0].time_entries[0].client_id = 200;
      apiResponse.timers[0].time_entries[0].service_id = 300;
      apiResponse.timers[0].time_entries[0].task_id = 400;

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerCurrentHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.activeTimers[0].projectId).toBe(100);
      expect(result.activeTimers[0].clientId).toBe(200);
      expect(result.activeTimers[0].serviceId).toBe(300);
      expect(result.activeTimers[0].taskId).toBe(400);
    });
  });
});
