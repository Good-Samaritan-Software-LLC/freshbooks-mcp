/**
 * Tests for timeentry_single tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { timeentrySingleTool } from '../../../src/tools/time-entry/timeentry-single.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockTimeEntrySingleResponse,
  mockTimeEntryNotFoundError,
} from '../../mocks/responses/time-entry.js';
import {
  mockUnauthorizedError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('timeentry_single tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should retrieve a time entry by ID', async () => {
      const mockResponse = mockTimeEntrySingleResponse({ id: 12345 });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentrySingleTool.execute(
        { accountId: 'ABC123', timeEntryId: 12345 },
        mockClient as any
      );

      expect(result.id).toBe(12345);
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('note');
      expect(result).toHaveProperty('startedAt');
    });

    it('should retrieve time entry with all fields populated', async () => {
      const mockResponse = mockTimeEntrySingleResponse({
        id: 12345,
        projectId: 100,
        clientId: 200,
        serviceId: 300,
        taskId: 400,
        note: 'Detailed work notes',
        billable: true,
        billed: false,
        duration: 7200,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentrySingleTool.execute(
        { accountId: 'ABC123', timeEntryId: 12345 },
        mockClient as any
      );

      expect(result.projectId).toBe(100);
      expect(result.clientId).toBe(200);
      expect(result.serviceId).toBe(300);
      expect(result.taskId).toBe(400);
      expect(result.note).toBe('Detailed work notes');
      expect(result.billable).toBe(true);
      expect(result.duration).toBe(7200);
    });

    it('should retrieve active timer time entry', async () => {
      const mockResponse = mockTimeEntrySingleResponse({
        id: 12345,
        active: true,
        isLogged: false,
        duration: 0,
        timer: {
          id: 55555,
          isRunning: true,
        },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentrySingleTool.execute(
        { accountId: 'ABC123', timeEntryId: 12345 },
        mockClient as any
      );

      expect(result.active).toBe(true);
      expect(result.isLogged).toBe(false);
      expect(result.timer).toBeDefined();
      expect(result.timer?.isRunning).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle not found error', async () => {
      const mockResponse = mockTimeEntryNotFoundError(99999);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        timeentrySingleTool.execute(
          { accountId: 'ABC123', timeEntryId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            single: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        timeentrySingleTool.execute(
          { accountId: 'ABC123', timeEntryId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            single: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        timeentrySingleTool.execute(
          { accountId: 'ABC123', timeEntryId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle null data response', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            single: vi.fn().mockResolvedValue({ ok: true, data: null }),
          },
        };
        return apiCall(client);
      });

      await expect(
        timeentrySingleTool.execute(
          { accountId: 'ABC123', timeEntryId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        timeentrySingleTool.execute({ timeEntryId: 12345 } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require timeEntryId', async () => {
      await expect(
        timeentrySingleTool.execute({ accountId: 'ABC123' } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject non-numeric timeEntryId', async () => {
      await expect(
        timeentrySingleTool.execute(
          { accountId: 'ABC123', timeEntryId: 'invalid' as any },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle time entry with null optional fields', async () => {
      const mockResponse = mockTimeEntrySingleResponse({
        id: 12345,
        projectId: null,
        clientId: null,
        note: null,
        timer: null,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentrySingleTool.execute(
        { accountId: 'ABC123', timeEntryId: 12345 },
        mockClient as any
      );

      expect(result.projectId).toBeNull();
      expect(result.clientId).toBeNull();
      expect(result.note).toBeNull();
      expect(result.timer).toBeNull();
    });

    it('should handle time entry with very long note', async () => {
      const longNote = 'A'.repeat(5000);
      const mockResponse = mockTimeEntrySingleResponse({
        id: 12345,
        note: longNote,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentrySingleTool.execute(
        { accountId: 'ABC123', timeEntryId: 12345 },
        mockClient as any
      );

      expect(result.note).toBe(longNote);
    });

    it('should handle time entry with zero duration', async () => {
      const mockResponse = mockTimeEntrySingleResponse({
        id: 12345,
        duration: 0,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentrySingleTool.execute(
        { accountId: 'ABC123', timeEntryId: 12345 },
        mockClient as any
      );

      expect(result.duration).toBe(0);
    });
  });
});
