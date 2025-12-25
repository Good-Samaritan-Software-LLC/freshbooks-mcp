/**
 * Tests for timer_discard tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { timerDiscardTool, timerDiscardHandler } from '../../../src/tools/timer/timer-discard.js';
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

describe('timer_discard tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful discard', () => {
    it('should discard a running timer', async () => {
      const mockResponse = mockTimeEntryDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerDiscardHandler(
        { accountId: 'ABC123', timeEntryId: 12345 },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.success).toBe(true);
      expect(result.timeEntryId).toBe(12345);
      expect(result.message).toContain('12345');
      expect(result.message).toContain('discarded');
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

      const result = await timerDiscardHandler(
        { accountId: 'ABC123', timeEntryId: 12345 },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.message).toBeDefined();
      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should confirm no time was logged', async () => {
      const mockResponse = mockTimeEntryDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerDiscardHandler(
        { accountId: 'ABC123', timeEntryId: 12345 },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.message.toLowerCase()).toContain('no time');
    });

    it('should discard timer with large ID', async () => {
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

      const result = await timerDiscardHandler(
        { accountId: 'ABC123', timeEntryId: largeId },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.success).toBe(true);
      expect(result.timeEntryId).toBe(largeId);
    });
  });

  describe('error handling', () => {
    it('should handle timer not found error', async () => {
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
        timerDiscardHandler(
          { accountId: 'ABC123', timeEntryId: 99999 },
          { accountId: 'ABC123', client: mockClient as any }
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
        timerDiscardHandler(
          { accountId: 'ABC123', timeEntryId: 12345 },
          { accountId: 'ABC123', client: mockClient as any }
        )
      ).rejects.toThrow();
    });

    it('should handle forbidden error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            delete: vi.fn().mockResolvedValue(mockForbiddenError('Timer')),
          },
        };
        return apiCall(client);
      });

      await expect(
        timerDiscardHandler(
          { accountId: 'ABC123', timeEntryId: 12345 },
          { accountId: 'ABC123', client: mockClient as any }
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
        timerDiscardHandler(
          { accountId: 'ABC123', timeEntryId: 12345 },
          { accountId: 'ABC123', client: mockClient as any }
        )
      ).rejects.toThrow();
    });

    it('should handle already discarded timer', async () => {
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
        timerDiscardHandler(
          { accountId: 'ABC123', timeEntryId: 12345 },
          { accountId: 'ABC123', client: mockClient as any }
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        timerDiscardHandler(
          { timeEntryId: 12345 } as any,
          { client: mockClient as any } as any
        )
      ).rejects.toThrow();
    });

    it('should require timeEntryId', async () => {
      await expect(
        timerDiscardHandler(
          { accountId: 'ABC123' } as any,
          { accountId: 'ABC123', client: mockClient as any }
        )
      ).rejects.toThrow();
    });

    it('should reject empty accountId', async () => {
      await expect(
        timerDiscardHandler(
          { accountId: '', timeEntryId: 12345 },
          { accountId: '', client: mockClient as any }
        )
      ).rejects.toThrow();
    });

    it('should reject non-numeric timeEntryId', async () => {
      await expect(
        timerDiscardHandler(
          { accountId: 'ABC123', timeEntryId: 'invalid' as any },
          { accountId: 'ABC123', client: mockClient as any }
        )
      ).rejects.toThrow();
    });

    it('should reject zero timeEntryId', async () => {
      await expect(
        timerDiscardHandler(
          { accountId: 'ABC123', timeEntryId: 0 },
          { accountId: 'ABC123', client: mockClient as any }
        )
      ).rejects.toThrow();
    });

    it('should reject negative timeEntryId', async () => {
      await expect(
        timerDiscardHandler(
          { accountId: 'ABC123', timeEntryId: -1 },
          { accountId: 'ABC123', client: mockClient as any }
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle discard of stopped timer (deletes logged time)', async () => {
      const mockResponse = mockTimeEntryDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerDiscardHandler(
        { accountId: 'ABC123', timeEntryId: 12345 },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.success).toBe(true);
    });

    it('should handle special characters in accountId', async () => {
      const mockResponse = mockTimeEntryDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerDiscardHandler(
        { accountId: 'ABC-123_XYZ', timeEntryId: 12345 },
        { accountId: 'ABC-123_XYZ', client: mockClient as any }
      );

      expect(result.success).toBe(true);
    });

    it('should verify message includes timer ID', async () => {
      const mockResponse = mockTimeEntryDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerDiscardHandler(
        { accountId: 'ABC123', timeEntryId: 54321 },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.message).toContain('54321');
    });

    it('should be idempotent for different timer IDs', async () => {
      const mockResponse = mockTimeEntryDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result1 = await timerDiscardHandler(
        { accountId: 'ABC123', timeEntryId: 111 },
        { accountId: 'ABC123', client: mockClient as any }
      );

      const result2 = await timerDiscardHandler(
        { accountId: 'ABC123', timeEntryId: 222 },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result1.timeEntryId).toBe(111);
      expect(result2.timeEntryId).toBe(222);
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('should handle maximum integer timeEntryId', async () => {
      const maxId = Number.MAX_SAFE_INTEGER;
      const mockResponse = mockTimeEntryDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerDiscardHandler(
        { accountId: 'ABC123', timeEntryId: maxId },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.success).toBe(true);
      expect(result.timeEntryId).toBe(maxId);
    });
  });

  describe('difference from timer_stop', () => {
    it('should permanently delete instead of logging time', async () => {
      const mockResponse = mockTimeEntryDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerDiscardHandler(
        { accountId: 'ABC123', timeEntryId: 12345 },
        { accountId: 'ABC123', client: mockClient as any }
      );

      // Verify it's a delete, not update
      expect(result.success).toBe(true);
      expect(result.message.toLowerCase()).toContain('discard');
      expect(result.message.toLowerCase()).not.toContain('stop');
    });

    it('should indicate time was not logged in message', async () => {
      const mockResponse = mockTimeEntryDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          timeEntries: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await timerDiscardHandler(
        { accountId: 'ABC123', timeEntryId: 12345 },
        { accountId: 'ABC123', client: mockClient as any }
      );

      expect(result.message.toLowerCase()).toContain('no time');
      expect(result.message.toLowerCase()).toContain('log');
    });
  });
});
