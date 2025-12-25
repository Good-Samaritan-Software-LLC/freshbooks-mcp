/**
 * Tests for callback_verify tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { callbackVerifyTool } from '../../../src/tools/callback/callback-verify.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockCallbackVerifyResponse,
  mockCallbackNotFoundError,
  mockCallbackInvalidVerifierError,
  mockCallbackAlreadyVerifiedError,
} from '../../mocks/responses/callback.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
  mockInvalidAccountError,
  mockForbiddenError,
  mockBadRequestError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('callback_verify tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should verify a callback successfully', async () => {
      const mockResponse = mockCallbackVerifyResponse(12345, true);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            verify: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackVerifyTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 12345,
          verifier: 'abc123xyz789',
        },
        mockClient as any
      );

      expect(result.success).toBe(true);
      expect(result.verified).toBe(true);
      expect(result.callbackId).toBe(12345);
    });

    it('should handle verification with different verifier formats', async () => {
      const verifiers = [
        'abc123xyz',
        'ABC123XYZ',
        '123456789',
        'abc-123-xyz',
        'abc_123_xyz',
        'abcdefghijklmnopqrstuvwxyz0123456789',
      ];

      for (const verifier of verifiers) {
        const mockResponse = mockCallbackVerifyResponse(12345, true);

        mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
          const client = {
            callbacks: {
              verify: vi.fn().mockResolvedValue(mockResponse),
            },
          };
          return apiCall(client);
        });

        const result = await callbackVerifyTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
            verifier,
          },
          mockClient as any
        );

        expect(result.success).toBe(true);
        expect(result.verified).toBe(true);
      }
    });

    it('should return verified status after successful verification', async () => {
      const mockResponse = mockCallbackVerifyResponse(67890, true);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            verify: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackVerifyTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 67890,
          verifier: 'valid-verifier-code',
        },
        mockClient as any
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('verified');
      expect(result).toHaveProperty('callbackId');
      expect(result.verified).toBe(true);
    });

    it('should handle verification for different callback IDs', async () => {
      const callbackIds = [12345, 67890, 11111, 99999];

      for (const callbackId of callbackIds) {
        const mockResponse = mockCallbackVerifyResponse(callbackId, true);

        mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
          const client = {
            callbacks: {
              verify: vi.fn().mockResolvedValue(mockResponse),
            },
          };
          return apiCall(client);
        });

        const result = await callbackVerifyTool.execute(
          {
            accountId: 'ABC123',
            callbackId,
            verifier: 'valid-code',
          },
          mockClient as any
        );

        expect(result.callbackId).toBe(callbackId);
        expect(result.verified).toBe(true);
      }
    });
  });

  describe('verification errors', () => {
    it('should handle invalid verifier error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            verify: vi.fn().mockResolvedValue(mockCallbackInvalidVerifierError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackVerifyTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
            verifier: 'invalid-verifier',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle already verified callback error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            verify: vi.fn().mockResolvedValue(mockCallbackAlreadyVerifiedError(12345)),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackVerifyTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
            verifier: 'any-verifier',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle callback not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            verify: vi.fn().mockResolvedValue(mockCallbackNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackVerifyTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 99999,
            verifier: 'valid-code',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle expired verifier error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            verify: vi.fn().mockResolvedValue(mockBadRequestError('Verification code has expired')),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackVerifyTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
            verifier: 'expired-code',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            verify: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackVerifyTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
            verifier: 'valid-code',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle forbidden error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            verify: vi.fn().mockResolvedValue(mockForbiddenError('callback')),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackVerifyTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
            verifier: 'valid-code',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            verify: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackVerifyTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
            verifier: 'valid-code',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            verify: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackVerifyTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
            verifier: 'valid-code',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        callbackVerifyTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
            verifier: 'valid-code',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle invalid account error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            verify: vi.fn().mockResolvedValue(mockInvalidAccountError('ABC123')),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackVerifyTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
            verifier: 'valid-code',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        callbackVerifyTool.execute(
          {
            callbackId: 12345,
            verifier: 'valid-code',
          } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require callbackId', async () => {
      await expect(
        callbackVerifyTool.execute(
          {
            accountId: 'ABC123',
            verifier: 'valid-code',
          } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require verifier', async () => {
      await expect(
        callbackVerifyTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
          } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require numeric callbackId', async () => {
      await expect(
        callbackVerifyTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 'not-a-number' as any,
            verifier: 'valid-code',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject empty verifier string', async () => {
      await expect(
        callbackVerifyTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
            verifier: '',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle very long verifier codes', async () => {
      const longVerifier = 'a'.repeat(256);
      const mockResponse = mockCallbackVerifyResponse(12345, true);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            verify: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackVerifyTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 12345,
          verifier: longVerifier,
        },
        mockClient as any
      );

      expect(result.success).toBe(true);
    });

    it('should handle verifiers with special characters', async () => {
      const mockResponse = mockCallbackVerifyResponse(12345, true);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            verify: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackVerifyTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 12345,
          verifier: 'abc-123_xyz.789',
        },
        mockClient as any
      );

      expect(result.success).toBe(true);
    });

    it('should handle very large callback IDs', async () => {
      const largeId = 999999999;
      const mockResponse = mockCallbackVerifyResponse(largeId, true);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            verify: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackVerifyTool.execute(
        {
          accountId: 'ABC123',
          callbackId: largeId,
          verifier: 'valid-code',
        },
        mockClient as any
      );

      expect(result.callbackId).toBe(largeId);
    });

    it('should handle case-sensitive verifier codes', async () => {
      const mockResponse = mockCallbackVerifyResponse(12345, true);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            verify: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackVerifyTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 12345,
          verifier: 'AbC123XyZ',
        },
        mockClient as any
      );

      expect(result.success).toBe(true);
    });
  });
});
