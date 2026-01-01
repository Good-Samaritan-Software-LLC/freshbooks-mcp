/**
 * Tests for timeentry_delete tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { timeentryDeleteTool } from '../../../src/tools/time-entry/timeentry-delete.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockTimeEntryDeleteResponse,
  mockTimeEntryNotFoundError,
} from '../../mocks/responses/time-entry.js';
import {
  mockUnauthorizedError,
  mockServerError,
  mockForbiddenError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('timeentry_delete tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful deletion', () => {
    it('should delete time entry successfully', async () => {
      const mockResponse = mockTimeEntryDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryDeleteTool.execute(
        { accountId: 'ABC123', timeEntryId: 12345 },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.timeEntryId).toBe(12345);
      expect(result.message).toContain('12345');
      expect(result.message).toContain('deleted successfully');
    });

    it('should return confirmation message', async () => {
      const mockResponse = mockTimeEntryDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryDeleteTool.execute(
        { accountId: 'ABC123', timeEntryId: 99999 },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(typeof result.message).toBe('string');
    });

    it('should delete active timer without logging', async () => {
      const mockResponse = mockTimeEntryDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryDeleteTool.execute(
        { accountId: 'ABC123', timeEntryId: 55555 },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.timeEntryId).toBe(55555);
    });
  });

  describe('error handling', () => {
    it('should handle not found error', async () => {
      const mockResponse = mockTimeEntryNotFoundError(99999);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        timeentryDeleteTool.execute(
          { accountId: 'ABC123', timeEntryId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            delete: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        timeentryDeleteTool.execute(
          { accountId: 'ABC123', timeEntryId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle forbidden error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            delete: vi.fn().mockResolvedValue(mockForbiddenError('TimeEntry')),
          },
        };
        return apiCall(client);
      });

      await expect(
        timeentryDeleteTool.execute(
          { accountId: 'ABC123', timeEntryId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            delete: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        timeentryDeleteTool.execute(
          { accountId: 'ABC123', timeEntryId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        timeentryDeleteTool.execute({ timeEntryId: 12345 } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require timeEntryId', async () => {
      await expect(
        timeentryDeleteTool.execute({ accountId: 'ABC123' } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject non-numeric timeEntryId', async () => {
      await expect(
        timeentryDeleteTool.execute(
          { accountId: 'ABC123', timeEntryId: 'invalid' as any },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject empty accountId', async () => {
      await expect(
        timeentryDeleteTool.execute(
          { accountId: '', timeEntryId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle deletion of already deleted entry', async () => {
      const mockResponse = mockTimeEntryNotFoundError(12345);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        timeentryDeleteTool.execute(
          { accountId: 'ABC123', timeEntryId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle very large timeEntryId', async () => {
      const largeId = 999999999;
      const mockResponse = mockTimeEntryDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryDeleteTool.execute(
        { accountId: 'ABC123', timeEntryId: largeId },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.timeEntryId).toBe(largeId);
    });

    it('should handle deletion with special characters in accountId', async () => {
      const mockResponse = mockTimeEntryDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timeentryDeleteTool.execute(
        { accountId: 'ABC-123_XYZ', timeEntryId: 12345 },
        mockClient as any
      );

      expect(result.success).toBe(true);
    });
  });
});
