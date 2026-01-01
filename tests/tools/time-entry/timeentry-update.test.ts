/**
 * Tests for timeentry_update tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { timeentryUpdateTool } from '../../../src/tools/time-entry/timeentry-update.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockTimeEntryUpdateResponse,
  mockTimeEntryNotFoundError,
} from '../../mocks/responses/time-entry.js';
import {
  mockUnauthorizedError,
  mockValidationError,
  mockServerError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('timeentry_update tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful updates', () => {
    it('should update time entry duration', async () => {
      const mockResponse = mockTimeEntryUpdateResponse(12345, { duration: 7200 });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryUpdateTool.execute(
        { accountId: 'ABC123', timeEntryId: 12345, duration: 7200 },
        mockClient as any
      );

      expect(result.id).toBe(12345);
      expect(result.duration).toBe(7200);
    });

    it('should update time entry note', async () => {
      const mockResponse = mockTimeEntryUpdateResponse(12345, {
        note: 'Updated work notes',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryUpdateTool.execute(
        { accountId: 'ABC123', timeEntryId: 12345, note: 'Updated work notes' },
        mockClient as any
      );

      expect(result.note).toBe('Updated work notes');
    });

    it('should update multiple fields', async () => {
      const mockResponse = mockTimeEntryUpdateResponse(12345, {
        duration: 5400,
        note: 'Updated notes',
        billable: false,
        projectId: 999,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryUpdateTool.execute(
        {
          accountId: 'ABC123',
          timeEntryId: 12345,
          duration: 5400,
          note: 'Updated notes',
          billable: false,
          projectId: 999,
        },
        mockClient as any
      );

      expect(result.duration).toBe(5400);
      expect(result.note).toBe('Updated notes');
      expect(result.billable).toBe(false);
      expect(result.projectId).toBe(999);
    });

    it('should stop a running timer (set active=false)', async () => {
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

      const result = await timeentryUpdateTool.execute(
        { accountId: 'ABC123', timeEntryId: 12345, active: false },
        mockClient as any
      );

      expect(result.active).toBe(false);
      expect(result.isLogged).toBe(true);
    });

    it('should update billable status', async () => {
      const mockResponse = mockTimeEntryUpdateResponse(12345, { billable: false });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryUpdateTool.execute(
        { accountId: 'ABC123', timeEntryId: 12345, billable: false },
        mockClient as any
      );

      expect(result.billable).toBe(false);
    });

    it('should update project association', async () => {
      const mockResponse = mockTimeEntryUpdateResponse(12345, { projectId: 555 });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryUpdateTool.execute(
        { accountId: 'ABC123', timeEntryId: 12345, projectId: 555 },
        mockClient as any
      );

      expect(result.projectId).toBe(555);
    });

    it('should remove project association (set to null)', async () => {
      const mockResponse = mockTimeEntryUpdateResponse(12345, { projectId: null });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryUpdateTool.execute(
        { accountId: 'ABC123', timeEntryId: 12345, projectId: null },
        mockClient as any
      );

      expect(result.projectId).toBeNull();
    });

    it('should update startedAt timestamp', async () => {
      const newStartTime = '2024-02-01T14:00:00Z';
      const mockResponse = mockTimeEntryUpdateResponse(12345, {
        startedAt: newStartTime,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryUpdateTool.execute(
        { accountId: 'ABC123', timeEntryId: 12345, startedAt: newStartTime },
        mockClient as any
      );

      expect(result.startedAt).toBe(newStartTime);
    });

    it('should update internal flag', async () => {
      const mockResponse = mockTimeEntryUpdateResponse(12345, { internal: true });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryUpdateTool.execute(
        { accountId: 'ABC123', timeEntryId: 12345, internal: true },
        mockClient as any
      );

      expect(result.internal).toBe(true);
    });
  });

  describe('validation errors', () => {
    it('should require at least one field to update', async () => {
      await expect(
        timeentryUpdateTool.execute(
          { accountId: 'ABC123', timeEntryId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require accountId', async () => {
      await expect(
        timeentryUpdateTool.execute(
          { timeEntryId: 12345, duration: 3600 } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require timeEntryId', async () => {
      await expect(
        timeentryUpdateTool.execute(
          { accountId: 'ABC123', duration: 3600 } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject negative duration', async () => {
      await expect(
        timeentryUpdateTool.execute(
          { accountId: 'ABC123', timeEntryId: 12345, duration: -100 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle validation error from API', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(
              mockValidationError('duration', 'Invalid duration value')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        timeentryUpdateTool.execute(
          { accountId: 'ABC123', timeEntryId: 12345, duration: 3600 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle not found error', async () => {
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
        timeentryUpdateTool.execute(
          { accountId: 'ABC123', timeEntryId: 99999, duration: 3600 },
          mockClient as any
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
        timeentryUpdateTool.execute(
          { accountId: 'ABC123', timeEntryId: 12345, duration: 3600 },
          mockClient as any
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
        timeentryUpdateTool.execute(
          { accountId: 'ABC123', timeEntryId: 12345, duration: 3600 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle null data response', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue({ ok: true, data: null }),
          },
        };
        return apiCall(client);
      });

      await expect(
        timeentryUpdateTool.execute(
          { accountId: 'ABC123', timeEntryId: 12345, duration: 3600 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should update duration to zero', async () => {
      const mockResponse = mockTimeEntryUpdateResponse(12345, { duration: 0 });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryUpdateTool.execute(
        { accountId: 'ABC123', timeEntryId: 12345, duration: 0 },
        mockClient as any
      );

      expect(result.duration).toBe(0);
    });

    it('should update note to empty string', async () => {
      const mockResponse = mockTimeEntryUpdateResponse(12345, { note: '' });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryUpdateTool.execute(
        { accountId: 'ABC123', timeEntryId: 12345, note: '' },
        mockClient as any
      );

      expect(result.note).toBe('');
    });

    it('should update note with unicode characters', async () => {
      const unicodeNote = 'テスト 🎉 special chars';
      const mockResponse = mockTimeEntryUpdateResponse(12345, { note: unicodeNote });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryUpdateTool.execute(
        { accountId: 'ABC123', timeEntryId: 12345, note: unicodeNote },
        mockClient as any
      );

      expect(result.note).toBe(unicodeNote);
    });

    it('should update very large duration value', async () => {
      const largeDuration = 86400 * 365; // 1 year
      const mockResponse = mockTimeEntryUpdateResponse(12345, {
        duration: largeDuration,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryUpdateTool.execute(
        { accountId: 'ABC123', timeEntryId: 12345, duration: largeDuration },
        mockClient as any
      );

      expect(result.duration).toBe(largeDuration);
    });
  });
});
