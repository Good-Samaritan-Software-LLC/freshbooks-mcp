/**
 * Tests for timeentry_create tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { timeentryCreateTool } from '../../../src/tools/time-entry/timeentry-create.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import { mockTimeEntryCreateResponse } from '../../mocks/responses/time-entry.js';
import {
  mockUnauthorizedError,
  mockValidationError,
  mockConflictError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('timeentry_create tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful creation', () => {
    it('should create time entry with required fields only', async () => {
      const mockResponse = mockTimeEntryCreateResponse({ duration: 3600 });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryCreateTool.execute(
        { accountId: 'ABC123', duration: 3600 },
        mockClient as any
      );

      expect(result.id).toBeDefined();
      expect(result.duration).toBe(3600);
      expect(result.isLogged).toBe(true);
    });

    it('should create time entry with all fields', async () => {
      const input = {
        accountId: 'ABC123',
        duration: 7200,
        note: 'Code review',
        projectId: 42,
        clientId: 100,
        serviceId: 5,
        taskId: 10,
        billable: true,
        internal: false,
      };
      const mockResponse = mockTimeEntryCreateResponse(input);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryCreateTool.execute(input, mockClient as any);

      expect(result.note).toBe('Code review');
      expect(result.projectId).toBe(42);
      expect(result.clientId).toBe(100);
      expect(result.serviceId).toBe(5);
      expect(result.taskId).toBe(10);
      expect(result.billable).toBe(true);
    });

    it('should create time entry with custom start time', async () => {
      const startTime = '2024-01-15T10:00:00Z';
      const mockResponse = mockTimeEntryCreateResponse({
        duration: 3600,
        startedAt: startTime,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryCreateTool.execute(
        {
          accountId: 'ABC123',
          duration: 3600,
          startedAt: startTime,
        },
        mockClient as any
      );

      expect(result.startedAt).toBe(startTime);
    });

    it('should create non-billable time entry', async () => {
      const mockResponse = mockTimeEntryCreateResponse({
        duration: 3600,
        billable: false,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryCreateTool.execute(
        {
          accountId: 'ABC123',
          duration: 3600,
          billable: false,
        },
        mockClient as any
      );

      expect(result.billable).toBe(false);
    });

    it('should create active timer entry (duration=0, active=true)', async () => {
      const mockResponse = mockTimeEntryCreateResponse({
        duration: 0,
        active: true,
        isLogged: false,
        timer: {
          id: 55555,
          isRunning: true,
        },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryCreateTool.execute(
        {
          accountId: 'ABC123',
          duration: 0,
          active: true,
          isLogged: false,
        },
        mockClient as any
      );

      expect(result.duration).toBe(0);
      expect(result.active).toBe(true);
      expect(result.isLogged).toBe(false);
      expect(result.timer?.isRunning).toBe(true);
    });

    it('should create internal time entry', async () => {
      const mockResponse = mockTimeEntryCreateResponse({
        duration: 3600,
        internal: true,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryCreateTool.execute(
        {
          accountId: 'ABC123',
          duration: 3600,
          internal: true,
        },
        mockClient as any
      );

      expect(result.internal).toBe(true);
    });

    it('should create time entry with retainer', async () => {
      const mockResponse = mockTimeEntryCreateResponse({
        duration: 3600,
        retainerId: 999,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryCreateTool.execute(
        {
          accountId: 'ABC123',
          duration: 3600,
          retainerId: 999,
        },
        mockClient as any
      );

      expect(result.retainerId).toBe(999);
    });
  });

  describe('validation errors', () => {
    it('should reject negative duration', async () => {
      await expect(
        timeentryCreateTool.execute(
          { accountId: 'ABC123', duration: -100 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require accountId', async () => {
      await expect(
        timeentryCreateTool.execute({ duration: 3600 } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require duration', async () => {
      await expect(
        timeentryCreateTool.execute({ accountId: 'ABC123' } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle duplicate entry conflict', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(
              mockConflictError('TimeEntry', 'startedAt')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        timeentryCreateTool.execute(
          { accountId: 'ABC123', duration: 3600 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle validation error from API', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(
              mockValidationError('duration', 'Duration must be non-negative')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        timeentryCreateTool.execute(
          { accountId: 'ABC123', duration: 3600 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        timeentryCreateTool.execute(
          { accountId: 'ABC123', duration: 3600 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        timeentryCreateTool.execute(
          { accountId: 'ABC123', duration: 3600 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle null data response', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue({ ok: true, data: null }),
          },
        };
        return apiCall(client);
      });

      await expect(
        timeentryCreateTool.execute(
          { accountId: 'ABC123', duration: 3600 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should create time entry with zero duration (for timers)', async () => {
      const mockResponse = mockTimeEntryCreateResponse({ duration: 0 });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryCreateTool.execute(
        { accountId: 'ABC123', duration: 0 },
        mockClient as any
      );

      expect(result.duration).toBe(0);
    });

    it('should create time entry with very long duration', async () => {
      const longDuration = 86400 * 30; // 30 days in seconds
      const mockResponse = mockTimeEntryCreateResponse({ duration: longDuration });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryCreateTool.execute(
        { accountId: 'ABC123', duration: longDuration },
        mockClient as any
      );

      expect(result.duration).toBe(longDuration);
    });

    it('should create time entry with empty note', async () => {
      const mockResponse = mockTimeEntryCreateResponse({
        duration: 3600,
        note: '',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryCreateTool.execute(
        { accountId: 'ABC123', duration: 3600, note: '' },
        mockClient as any
      );

      expect(result.note).toBe('');
    });

    it('should create time entry with unicode characters in note', async () => {
      const unicodeNote = '日本語 🎉 émojis & symbols ©';
      const mockResponse = mockTimeEntryCreateResponse({
        duration: 3600,
        note: unicodeNote,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryCreateTool.execute(
        { accountId: 'ABC123', duration: 3600, note: unicodeNote },
        mockClient as any
      );

      expect(result.note).toBe(unicodeNote);
    });
  });
});
