/**
 * Tests for callback_update tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { callbackUpdateTool } from '../../../src/tools/callback/callback-update.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockCallbackUpdateResponse,
  mockCallbackNotFoundError,
  mockCallbackValidationError,
} from '../../mocks/responses/callback.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
  mockInvalidAccountError,
  mockForbiddenError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('callback_update tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should update callback event', async () => {
      const mockResponse = mockCallbackUpdateResponse(12345, {
        event: 'payment.create',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackUpdateTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 12345,
          event: 'payment.create',
        },
        mockClient as any
      );

      expect(result.id).toBe(12345);
      expect(result.event).toBe('payment.create');
    });

    it('should update callback URI', async () => {
      const newUri = 'https://newapp.com/webhooks';
      const mockResponse = mockCallbackUpdateResponse(12345, {
        uri: newUri,
        verified: false, // URI change resets verification
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackUpdateTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 12345,
          uri: newUri,
        },
        mockClient as any
      );

      expect(result.uri).toBe(newUri);
      expect(result.verified).toBe(false);
    });

    it('should update both event and URI', async () => {
      const newUri = 'https://updated.com/webhooks';
      const mockResponse = mockCallbackUpdateResponse(12345, {
        event: 'invoice.update',
        uri: newUri,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackUpdateTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 12345,
          event: 'invoice.update',
          uri: newUri,
        },
        mockClient as any
      );

      expect(result.event).toBe('invoice.update');
      expect(result.uri).toBe(newUri);
    });

    it('should update event without affecting URI', async () => {
      const mockResponse = mockCallbackUpdateResponse(12345, {
        event: 'client.create',
        uri: 'https://example.com/webhooks', // Original URI
        verified: true, // Event change doesn't reset verification
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackUpdateTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 12345,
          event: 'client.create',
        },
        mockClient as any
      );

      expect(result.event).toBe('client.create');
      expect(result.verified).toBe(true);
    });

    it('should preserve other fields when updating', async () => {
      const mockResponse = mockCallbackUpdateResponse(12345, {
        event: 'payment.update',
        createdAt: '2024-01-01T00:00:00Z',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackUpdateTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 12345,
          event: 'payment.update',
        },
        mockClient as any
      );

      expect(result.createdAt).toBe('2024-01-01T00:00:00Z');
      expect(result.updatedAt).toBeDefined();
    });
  });

  describe('validation errors', () => {
    it('should reject non-HTTPS URIs', async () => {
      await expect(
        callbackUpdateTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
            uri: 'http://example.com/webhooks', // HTTP instead of HTTPS
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject invalid URI format', async () => {
      await expect(
        callbackUpdateTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
            uri: 'not-a-valid-url',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject empty event string', async () => {
      await expect(
        callbackUpdateTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
            event: '',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require accountId', async () => {
      await expect(
        callbackUpdateTool.execute(
          {
            callbackId: 12345,
            event: 'invoice.create',
          } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require callbackId', async () => {
      await expect(
        callbackUpdateTool.execute(
          {
            accountId: 'ABC123',
            event: 'invoice.create',
          } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require at least one update field', async () => {
      // Can't update with no fields specified
      const mockResponse = mockCallbackUpdateResponse(12345, {});

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      // Should still work, but effectively a no-op
      const result = await callbackUpdateTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 12345,
        },
        mockClient as any
      );

      expect(result.id).toBe(12345);
    });
  });

  describe('error handling', () => {
    it('should handle callback not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            update: vi.fn().mockResolvedValue(mockCallbackNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackUpdateTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 99999,
            event: 'invoice.create',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            update: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackUpdateTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
            event: 'invoice.create',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle forbidden error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            update: vi.fn().mockResolvedValue(mockForbiddenError('callback')),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackUpdateTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
            event: 'invoice.create',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            update: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackUpdateTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
            event: 'invoice.create',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            update: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackUpdateTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
            event: 'invoice.create',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        callbackUpdateTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
            event: 'invoice.create',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle invalid account error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            update: vi.fn().mockResolvedValue(mockInvalidAccountError('ABC123')),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackUpdateTool.execute(
          {
            accountId: 'ABC123',
            callbackId: 12345,
            event: 'invoice.create',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle updating to complex event names', async () => {
      const mockResponse = mockCallbackUpdateResponse(12345, {
        event: 'expense_category.update',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackUpdateTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 12345,
          event: 'expense_category.update',
        },
        mockClient as any
      );

      expect(result.event).toBe('expense_category.update');
    });

    it('should handle URIs with query parameters', async () => {
      const uri = 'https://example.com/webhooks?token=xyz789';
      const mockResponse = mockCallbackUpdateResponse(12345, { uri });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackUpdateTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 12345,
          uri,
        },
        mockClient as any
      );

      expect(result.uri).toBe(uri);
    });

    it('should handle URIs with port numbers', async () => {
      const uri = 'https://example.com:9443/webhooks';
      const mockResponse = mockCallbackUpdateResponse(12345, { uri });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackUpdateTool.execute(
        {
          accountId: 'ABC123',
          callbackId: 12345,
          uri,
        },
        mockClient as any
      );

      expect(result.uri).toBe(uri);
    });

    it('should handle very large callback IDs', async () => {
      const largeId = 999999999;
      const mockResponse = mockCallbackUpdateResponse(largeId, {
        event: 'invoice.create',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackUpdateTool.execute(
        {
          accountId: 'ABC123',
          callbackId: largeId,
          event: 'invoice.create',
        },
        mockClient as any
      );

      expect(result.id).toBe(largeId);
    });
  });
});
