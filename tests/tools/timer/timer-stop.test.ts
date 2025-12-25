/**
 * Tests for timer_stop tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { timerStopTool, timerStopHandler } from '../../../src/tools/timer/timer-stop.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockTimeEntryUpdateResponse,
  mockTimeEntryNotFoundError,
} from '../../mocks/responses/time-entry.js';
import {
  mockUnauthorizedError,
  mockServerError,
  mockNoActiveTimerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('timer_stop tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful timer stop', () => {
    it('should stop a running timer', async () => {
      const mockResponse = mockTimeEntryUpdateResponse(12345, {
        active: false,
        isLogged: true,
        duration: 3600, // Auto-calculated by FreshBooks
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerStopHandler(
        { accountId: 'ABC123', timeEntryId: 12345 },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.active).toBe(false);
      expect(result.isLogged).toBe(true);
      expect(result.duration).toBe(3600);
    });

    it('should stop timer and update note', async () => {
      const mockResponse = mockTimeEntryUpdateResponse(12345, {
        active: false,
        isLogged: true,
        duration: 3600,
        note: 'Completed feature development',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerStopHandler(
        {
          accountId: 'ABC123',
          timeEntryId: 12345,
          note: 'Completed feature development',
        },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.active).toBe(false);
      expect(result.note).toBe('Completed feature development');
    });

    it('should stop timer with auto-calculated duration', async () => {
      const mockResponse = mockTimeEntryUpdateResponse(12345, {
        active: false,
        isLogged: true,
        duration: 7200, // 2 hours calculated by FreshBooks
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerStopHandler(
        { accountId: 'ABC123', timeEntryId: 12345 },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.duration).toBe(7200);
      expect(result.active).toBe(false);
    });

    it('should preserve other timer fields when stopping', async () => {
      const mockResponse = mockTimeEntryUpdateResponse(12345, {
        active: false,
        isLogged: true,
        duration: 3600,
        projectId: 100,
        clientId: 200,
        billable: true,
        note: 'Previous note',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerStopHandler(
        { accountId: 'ABC123', timeEntryId: 12345 },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.projectId).toBe(100);
      expect(result.clientId).toBe(200);
      expect(result.billable).toBe(true);
      expect(result.note).toBe('Previous note');
    });

    it('should handle stopping timer with very long duration', async () => {
      const longDuration = 86400 * 7; // 7 days in seconds
      const mockResponse = mockTimeEntryUpdateResponse(12345, {
        active: false,
        isLogged: true,
        duration: longDuration,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerStopHandler(
        { accountId: 'ABC123', timeEntryId: 12345 },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.duration).toBe(longDuration);
    });
  });

  describe('error handling', () => {
    it('should handle timer not found error', async () => {
      const mockResponse = mockTimeEntryNotFoundError(99999);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        timerStopHandler(
          { accountId: 'ABC123', timeEntryId: 99999 },
          { accountId: 'ABC123', client: mockClient as any }
        )
      ).rejects.toThrow();
    });

    it('should handle no active timer error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockNoActiveTimerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        timerStopHandler(
          { accountId: 'ABC123', timeEntryId: 12345 },
          { accountId: 'ABC123', client: mockClient as any }
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        timerStopHandler(
          { accountId: 'ABC123', timeEntryId: 12345 },
          { accountId: 'ABC123', client: mockClient as any }
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        timerStopHandler(
          { accountId: 'ABC123', timeEntryId: 12345 },
          { accountId: 'ABC123', client: mockClient as any }
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        timerStopHandler(
          { timeEntryId: 12345 } as any,
          { client: mockClient as any } as any
        )
      ).rejects.toThrow();
    });

    it('should require timeEntryId', async () => {
      await expect(
        timerStopHandler(
          { accountId: 'ABC123' } as any,
          { accountId: 'ABC123', client: mockClient as any }
        )
      ).rejects.toThrow();
    });

    it('should reject empty accountId', async () => {
      await expect(
        timerStopHandler(
          { accountId: '', timeEntryId: 12345 },
          { accountId: '', client: mockClient as any }
        )
      ).rejects.toThrow();
    });

    it('should reject non-numeric timeEntryId', async () => {
      await expect(
        timerStopHandler(
          { accountId: 'ABC123', timeEntryId: 'invalid' as any },
          { accountId: 'ABC123', client: mockClient as any }
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty note update', async () => {
      const mockResponse = mockTimeEntryUpdateResponse(12345, {
        active: false,
        isLogged: true,
        duration: 3600,
        note: '',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerStopHandler(
        { accountId: 'ABC123', timeEntryId: 12345, note: '' },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.note).toBe('');
    });

    it('should handle unicode characters in note', async () => {
      const unicodeNote = 'テスト 🎉 completed';
      const mockResponse = mockTimeEntryUpdateResponse(12345, {
        active: false,
        isLogged: true,
        duration: 3600,
        note: unicodeNote,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerStopHandler(
        { accountId: 'ABC123', timeEntryId: 12345, note: unicodeNote },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.note).toBe(unicodeNote);
    });

    it('should handle timer with zero duration (stopped immediately)', async () => {
      const mockResponse = mockTimeEntryUpdateResponse(12345, {
        active: false,
        isLogged: true,
        duration: 0,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerStopHandler(
        { accountId: 'ABC123', timeEntryId: 12345 },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.duration).toBe(0);
    });

    it('should handle very large timeEntryId', async () => {
      const largeId = 999999999;
      const mockResponse = mockTimeEntryUpdateResponse(largeId, {
        active: false,
        isLogged: true,
        duration: 3600,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerStopHandler(
        { accountId: 'ABC123', timeEntryId: largeId },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.id).toBe(largeId);
    });

    it('should handle idempotent stop (stopping already stopped timer)', async () => {
      const mockResponse = mockTimeEntryUpdateResponse(12345, {
        active: false,
        isLogged: true,
        duration: 3600,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerStopHandler(
        { accountId: 'ABC123', timeEntryId: 12345 },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.active).toBe(false);
      expect(result.isLogged).toBe(true);
    });
  });
});
