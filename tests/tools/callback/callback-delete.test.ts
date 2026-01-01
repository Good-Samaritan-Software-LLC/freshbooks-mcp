/**
 * Tests for callback_delete tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { callbackDeleteTool } from '../../../src/tools/callback/callback-delete.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockCallbackDeleteResponse,
  mockCallbackNotFoundError,
} from '../../mocks/responses/callback.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
  mockInvalidAccountError,
  mockForbiddenError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('callback_delete tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should delete a callback successfully', async () => {
      const mockResponse = mockCallbackDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackDeleteTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 12345,
        },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.callbackId).toBe(12345);
    });

    it('should delete callback and return correct ID', async () => {
      const mockResponse = mockCallbackDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackDeleteTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 67890,
        },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.callbackId).toBe(67890);
    });

    it('should delete verified callback', async () => {
      const mockResponse = mockCallbackDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackDeleteTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 11111,
        },
        mockClient as any
      );

      expect(result.success).toBe(true);
    });

    it('should delete unverified callback', async () => {
      const mockResponse = mockCallbackDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackDeleteTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 22222,
        },
        mockClient as any
      );

      expect(result.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle callback not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            delete: vi.fn().mockResolvedValue(mockCallbackNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackDeleteTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 99999,
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            delete: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackDeleteTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle forbidden error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            delete: vi.fn().mockResolvedValue(mockForbiddenError('callback')),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackDeleteTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            delete: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackDeleteTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            delete: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackDeleteTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        callbackDeleteTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle invalid account error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            delete: vi.fn().mockResolvedValue(mockInvalidAccountError('ABC123')),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackDeleteTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        callbackDeleteTool.execute(
          {
            callbackId: 12345,
          } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require callbackId', async () => {
      await expect(
        callbackDeleteTool.execute(
          {
            accountId: 'ABC123',
          } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require numeric callbackId', async () => {
      await expect(
        callbackDeleteTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 'not-a-number' as any,
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject negative callbackId', async () => {
      await expect(
        callbackDeleteTool.execute(
          {
            accountId: 'ABC123',
            callbackId: -1,
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle deletion with very large callback ID', async () => {
      const largeId = 999999999;
      const mockResponse = mockCallbackDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackDeleteTool.execute(
        {
          accountId: 'ABC123',
          callbackId: largeId,
        },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.callbackId).toBe(largeId);
    });

    it('should handle deletion with minimum callback ID', async () => {
      const mockResponse = mockCallbackDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackDeleteTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 1,
        },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.callbackId).toBe(1);
    });

    it('should handle multiple consecutive deletions', async () => {
      const mockResponse = mockCallbackDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      // Delete first callback
      const result1 = await callbackDeleteTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 100,
        },
        mockClient as any
      );

      expect(result1.success).toBe(true);
      expect(result1.callbackId).toBe(100);

      // Delete second callback
      const result2 = await callbackDeleteTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 200,
        },
        mockClient as any
      );

      expect(result2.success).toBe(true);
      expect(result2.callbackId).toBe(200);
    });

    it('should handle deletion across different accounts', async () => {
      const mockResponse = mockCallbackDeleteResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            delete: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result1 = await callbackDeleteTool.execute(
        {
          accountId: 'ACCOUNT1',
          callbackId: 12345,
        },
        mockClient as any
      );

      expect(result1.success).toBe(true);

      const result2 = await callbackDeleteTool.execute(
        {
          accountId: 'ACCOUNT2',
          callbackId: 12345, // Same ID, different account
        },
        mockClient as any
      );

      expect(result2.success).toBe(true);
    });
  });
});
