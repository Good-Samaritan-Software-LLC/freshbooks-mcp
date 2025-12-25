/**
 * Tests for callback_resend_verification tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { callbackResendVerificationTool } from '../../../src/tools/callback/callback-resend-verification.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockCallbackResendVerificationResponse,
  mockCallbackNotFoundError,
  mockCallbackAlreadyVerifiedError,
  mockCallbackUnreachableEndpointError,
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

describe('callback_resend_verification tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should resend verification successfully', async () => {
      const mockResponse = mockCallbackResendVerificationResponse(12345);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            resendVerification: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackResendVerificationTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 12345,
        },
        mockClient as any
      );

      expect(result.id).toBe(12345);
      expect(result.verified).toBe(false);
    });

    it('should return unverified callback after resend', async () => {
      const mockResponse = mockCallbackResendVerificationResponse(67890);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            resendVerification: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackResendVerificationTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 67890,
        },
        mockClient as any
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('verified');
      expect(result).toHaveProperty('event');
      expect(result).toHaveProperty('uri');
      expect(result.verified).toBe(false);
    });

    it('should handle resend for different callback IDs', async () => {
      const callbackIds = [12345, 67890, 11111, 99999];

      for (const callbackId of callbackIds) {
        const mockResponse = mockCallbackResendVerificationResponse(callbackId);

        mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
          const client = {
            callbacks: {
              resendVerification: vi.fn().mockResolvedValue(mockResponse),
            },
          };
          return apiCall(client);
        });

        const result = await callbackResendVerificationTool.execute(
          {
            accountId: 'ABC123',
            callbackId,
          },
          mockClient as any
        );

        expect(result.id).toBe(callbackId);
        expect(result.verified).toBe(false);
      }
    });

    it('should update callback timestamp after resend', async () => {
      const mockResponse = mockCallbackResendVerificationResponse(12345);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            resendVerification: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackResendVerificationTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 12345,
        },
        mockClient as any
      );

      expect(result.updatedAt).toBeDefined();
    });

    it('should handle resend across different accounts', async () => {
      const mockResponse = mockCallbackResendVerificationResponse(12345);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            resendVerification: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result1 = await callbackResendVerificationTool.execute(
        {
          accountId: 'ACCOUNT1',
          callbackId: 12345,
        },
        mockClient as any
      );

      expect(result1.id).toBe(12345);

      const result2 = await callbackResendVerificationTool.execute(
        {
          accountId: 'ACCOUNT2',
          callbackId: 12345,
        },
        mockClient as any
      );

      expect(result2.id).toBe(12345);
    });
  });

  describe('error handling', () => {
    it('should handle callback not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            resendVerification: vi.fn().mockResolvedValue(mockCallbackNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackResendVerificationTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 99999,
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle already verified callback error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            resendVerification: vi.fn().mockResolvedValue(mockCallbackAlreadyVerifiedError(12345)),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackResendVerificationTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unreachable endpoint error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            resendVerification: vi
              .fn()
              .mockResolvedValue(
                mockCallbackUnreachableEndpointError('https://example.com/webhooks')
              ),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackResendVerificationTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            resendVerification: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackResendVerificationTool.execute(
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
            resendVerification: vi.fn().mockResolvedValue(mockForbiddenError('callback')),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackResendVerificationTool.execute(
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
            resendVerification: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackResendVerificationTool.execute(
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
            resendVerification: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackResendVerificationTool.execute(
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
        callbackResendVerificationTool.execute(
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
            resendVerification: vi.fn().mockResolvedValue(mockInvalidAccountError('ABC123')),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackResendVerificationTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle endpoint temporarily unavailable error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            resendVerification: vi
              .fn()
              .mockResolvedValue(mockBadRequestError('Endpoint temporarily unavailable')),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackResendVerificationTool.execute(
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
        callbackResendVerificationTool.execute(
          {
            callbackId: 12345,
          } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require callbackId', async () => {
      await expect(
        callbackResendVerificationTool.execute(
          {
            accountId: 'ABC123',
          } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require numeric callbackId', async () => {
      await expect(
        callbackResendVerificationTool.execute(
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
        callbackResendVerificationTool.execute(
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
    it('should handle very large callback IDs', async () => {
      const largeId = 999999999;
      const mockResponse = mockCallbackResendVerificationResponse(largeId);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            resendVerification: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackResendVerificationTool.execute(
        {
          accountId: 'ABC123',
          callbackId: largeId,
        },
        mockClient as any
      );

      expect(result.id).toBe(largeId);
    });

    it('should handle minimum callback ID', async () => {
      const mockResponse = mockCallbackResendVerificationResponse(1);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            resendVerification: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackResendVerificationTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 1,
        },
        mockClient as any
      );

      expect(result.id).toBe(1);
    });

    it('should handle multiple consecutive resend requests', async () => {
      const mockResponse = mockCallbackResendVerificationResponse(12345);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            resendVerification: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      // First resend
      const result1 = await callbackResendVerificationTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 12345,
        },
        mockClient as any
      );

      expect(result1.verified).toBe(false);

      // Second resend
      const result2 = await callbackResendVerificationTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 12345,
        },
        mockClient as any
      );

      expect(result2.verified).toBe(false);
    });

    it('should handle resend for callbacks with various event types', async () => {
      const eventTypes = [
        'invoice.create',
        'payment.update',
        'time_entry.delete',
        'client.create',
        'expense_category.update',
      ];

      for (const event of eventTypes) {
        const mockResponse = mockCallbackResendVerificationResponse(12345);
        mockResponse.data.callback.event = event;

        mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
          const client = {
            callbacks: {
              resendVerification: vi.fn().mockResolvedValue(mockResponse),
            },
          };
          return apiCall(client);
        });

        const result = await callbackResendVerificationTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
          },
          mockClient as any
        );

        expect(result.event).toBe(event);
      }
    });

    it('should preserve callback URI and event after resend', async () => {
      const mockResponse = mockCallbackResendVerificationResponse(12345);
      mockResponse.data.callback.uri = 'https://example.com/webhooks';
      mockResponse.data.callback.event = 'invoice.create';

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            resendVerification: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackResendVerificationTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 12345,
        },
        mockClient as any
      );

      expect(result.uri).toBe('https://example.com/webhooks');
      expect(result.event).toBe('invoice.create');
    });
  });
});
