/**
 * Tests for timer_start tool
 *
 * Uses raw HTTP to POST /comments/business/{businessId}/time_entries
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { timerStartTool, timerStartHandler } from '../../../src/tools/timer/timer-start.js';
import { createMockClientWrapper } from '../../mocks/client.js';

/**
 * Create a mock time entry creation response
 */
function createMockTimeEntryResponse(overrides: Record<string, any> = {}) {
  return {
    time_entry: {
      id: 12345,
      identity_id: 1,
      is_logged: false,
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      client_id: null,
      project_id: null,
      task_id: null,
      service_id: null,
      note: null,
      active: true,
      billable: false,
      billed: false,
      internal: false,
      duration: null,
      timer: { id: 999, is_running: true },
      ...overrides,
    },
  };
}

describe('timer_start tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful timer start', () => {
    it('should start a timer successfully with minimal input', async () => {
      const apiResponse = createMockTimeEntryResponse();

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerStartHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.id).toBe(12345);
      expect(result.active).toBe(true);
      expect(result.isLogged).toBe(false);
      expect(result.timer?.isRunning).toBe(true);
    });

    it('should start a timer with project association', async () => {
      const apiResponse = createMockTimeEntryResponse({ project_id: 100 });

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerStartHandler(
        { businessId: 12345, projectId: 100 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.projectId).toBe(100);
      expect(mockClient.executeRawWithRetry).toHaveBeenCalledWith(
        'POST',
        '/comments/business/12345/time_entries',
        expect.objectContaining({
          time_entry: expect.objectContaining({
            project_id: 100,
          }),
        }),
        'timer_start'
      );
    });

    it('should start a timer with client association', async () => {
      const apiResponse = createMockTimeEntryResponse({ client_id: 200 });

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerStartHandler(
        { businessId: 12345, clientId: 200 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.clientId).toBe(200);
    });

    it('should start a timer with note', async () => {
      const apiResponse = createMockTimeEntryResponse({ note: 'Working on feature' });

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerStartHandler(
        { businessId: 12345, note: 'Working on feature' },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.note).toBe('Working on feature');
    });

    it('should start a timer with all optional fields', async () => {
      const apiResponse = createMockTimeEntryResponse({
        project_id: 100,
        client_id: 200,
        service_id: 300,
        task_id: 400,
        note: 'Full featured timer',
        billable: true,
        internal: false,
      });

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerStartHandler(
        {
          businessId: 12345,
          projectId: 100,
          clientId: 200,
          serviceId: 300,
          taskId: 400,
          note: 'Full featured timer',
          billable: true,
          internal: false,
        },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.projectId).toBe(100);
      expect(result.clientId).toBe(200);
      expect(result.serviceId).toBe(300);
      expect(result.taskId).toBe(400);
      expect(result.note).toBe('Full featured timer');
      expect(result.billable).toBe(true);
      expect(result.internal).toBe(false);
    });

    it('should start a non-billable timer', async () => {
      const apiResponse = createMockTimeEntryResponse({ billable: false });

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerStartHandler(
        { businessId: 12345, billable: false },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.billable).toBe(false);
    });

    it('should start an internal timer', async () => {
      const apiResponse = createMockTimeEntryResponse({ internal: true });

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerStartHandler(
        { businessId: 12345, internal: true },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.internal).toBe(true);
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
        timerStartHandler(
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
        timerStartHandler(
          { businessId: 12345 },
          { businessId: 12345, client: mockClient as any }
        )
      ).rejects.toThrow();
    });

    it('should handle duplicate timer error', async () => {
      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: false,
        status: 400,
        error: new Error('Timer already running'),
      });

      await expect(
        timerStartHandler(
          { businessId: 12345 },
          { businessId: 12345, client: mockClient as any }
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require businessId', async () => {
      await expect(
        timerStartHandler({} as any, { client: mockClient as any } as any)
      ).rejects.toThrow();
    });

    it('should reject zero businessId', async () => {
      await expect(
        timerStartHandler(
          { businessId: 0 } as any,
          { businessId: 0, client: mockClient as any }
        )
      ).rejects.toThrow();
    });

    it('should reject negative businessId', async () => {
      await expect(
        timerStartHandler(
          { businessId: -1 } as any,
          { businessId: -1, client: mockClient as any }
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty note', async () => {
      const apiResponse = createMockTimeEntryResponse({ note: '' });

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerStartHandler(
        { businessId: 12345, note: '' },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.note).toBe('');
    });

    it('should handle unicode characters in note', async () => {
      const unicodeNote = '日本語作業 🎉 testing';
      const apiResponse = createMockTimeEntryResponse({ note: unicodeNote });

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerStartHandler(
        { businessId: 12345, note: unicodeNote },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.note).toBe(unicodeNote);
    });

    it('should handle very long note', async () => {
      const longNote = 'A'.repeat(5000);
      const apiResponse = createMockTimeEntryResponse({ note: longNote });

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerStartHandler(
        { businessId: 12345, note: longNote },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.note).toBe(longNote);
    });

    it('should verify timer object structure', async () => {
      const apiResponse = createMockTimeEntryResponse();

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerStartHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.timer).toBeDefined();
      expect(result.timer?.id).toBe(999);
      expect(result.timer?.isRunning).toBe(true);
    });

    it('should handle timer without timer object in response', async () => {
      const apiResponse = createMockTimeEntryResponse({ timer: null });

      mockClient.executeRawWithRetry.mockResolvedValue({
        ok: true,
        status: 200,
        data: apiResponse,
      });

      const result = await timerStartHandler(
        { businessId: 12345 },
        { businessId: 12345, client: mockClient as any }
      );

      expect(result.timer).toBeNull();
    });
  });
});
