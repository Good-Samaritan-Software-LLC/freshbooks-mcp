/**
 * Tests for callback_single tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { callbackSingleTool } from '../../../src/tools/callback/callback-single.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockCallbackSingleResponse,
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

describe('callback_single tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return a single callback', async () => {
      const mockResponse = mockCallbackSingleResponse({
        id: 12345,
        event: 'invoice.create',
        uri: 'https://example.com/webhooks',
        verified: true,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackSingleTool.execute(
        { accountId: 'ABC123', callbackId: 12345 },
        mockClient as any
      );

      expect(result.id).toBe(12345);
      expect(result.event).toBe('invoice.create');
      expect(result.uri).toBe('https://example.com/webhooks');
      expect(result.verified).toBe(true);
    });

    it('should return unverified callback', async () => {
      const mockResponse = mockCallbackSingleResponse({
        id: 67890,
        verified: false,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackSingleTool.execute(
        { accountId: 'ABC123', callbackId: 67890 },
        mockClient as any
      );

      expect(result.id).toBe(67890);
      expect(result.verified).toBe(false);
    });

    it('should return callback with all properties', async () => {
      const mockResponse = mockCallbackSingleResponse({
        id: 99999,
        event: 'payment.create',
        uri: 'https://myapp.com/webhooks',
        verified: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T12:30:00Z',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackSingleTool.execute(
        { accountId: 'ABC123', callbackId: 99999 },
        mockClient as any
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('event');
      expect(result).toHaveProperty('uri');
      expect(result).toHaveProperty('verified');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should handle various event types', async () => {
      const eventTypes = [
        'invoice.create',
        'payment.update',
        'time_entry.delete',
        'client.create',
        'project.update',
      ];

      for (const event of eventTypes) {
        const mockResponse = mockCallbackSingleResponse({ event });

        mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
          const client = {
            callbacks: {
              single: vi.fn().mockResolvedValue(mockResponse),
            },
          };
          return apiCall(client);
        });

        const result = await callbackSingleTool.execute(
          { accountId: 'ABC123', callbackId: 12345 },
          mockClient as any
        );

        expect(result.event).toBe(event);
      }
    });
  });

  describe('error handling', () => {
    it('should handle callback not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            single: vi.fn().mockResolvedValue(mockCallbackNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackSingleTool.execute({ accountId: 'ABC123', callbackId: 99999 }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            single: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackSingleTool.execute({ accountId: 'ABC123', callbackId: 12345 }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle forbidden error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            single: vi.fn().mockResolvedValue(mockForbiddenError('callback')),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackSingleTool.execute({ accountId: 'ABC123', callbackId: 12345 }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            single: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackSingleTool.execute({ accountId: 'ABC123', callbackId: 12345 }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            single: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackSingleTool.execute({ accountId: 'ABC123', callbackId: 12345 }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        callbackSingleTool.execute({ accountId: 'ABC123', callbackId: 12345 }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle invalid account error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            single: vi.fn().mockResolvedValue(mockInvalidAccountError('ABC123')),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackSingleTool.execute({ accountId: 'ABC123', callbackId: 12345 }, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        callbackSingleTool.execute({ callbackId: 12345 } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require callbackId', async () => {
      await expect(
        callbackSingleTool.execute({ accountId: 'ABC123' } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require numeric callbackId', async () => {
      await expect(
        callbackSingleTool.execute(
          { accountId: 'ABC123', callbackId: 'invalid' as any },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle callback with special characters in URI', async () => {
      const mockResponse = mockCallbackSingleResponse({
        uri: 'https://example.com/webhooks?token=abc123&id=xyz',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackSingleTool.execute(
        { accountId: 'ABC123', callbackId: 12345 },
        mockClient as any
      );

      expect(result.uri).toContain('?token=');
      expect(result.uri).toContain('&id=');
    });

    it('should handle callback with complex event names', async () => {
      const mockResponse = mockCallbackSingleResponse({
        event: 'expense_category.update',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackSingleTool.execute(
        { accountId: 'ABC123', callbackId: 12345 },
        mockClient as any
      );

      expect(result.event).toBe('expense_category.update');
    });

    it('should handle very large callback IDs', async () => {
      const largeId = 999999999;
      const mockResponse = mockCallbackSingleResponse({ id: largeId });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackSingleTool.execute(
        { accountId: 'ABC123', callbackId: largeId },
        mockClient as any
      );

      expect(result.id).toBe(largeId);
    });
  });
});
