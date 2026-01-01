/**
 * Tests for callback_create tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { callbackCreateTool } from '../../../src/tools/callback/callback-create.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockCallbackCreateResponse,
  mockCallbackDuplicateError,
  mockCallbackUnreachableEndpointError,
  mockCallbackValidationError,
} from '../../mocks/responses/callback.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
  mockInvalidAccountError,
  mockValidationError,
  mockBadRequestError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('callback_create tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should create a callback with required fields', async () => {
      const mockResponse = mockCallbackCreateResponse({
        event: 'invoice.create',
        uri: 'https://example.com/webhooks',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackCreateTool.execute(
        {
          accountId: 'ABC123',
          event: 'invoice.create',
          uri: 'https://example.com/webhooks',
        },
        mockClient as any
      );

      expect(result.id).toBeDefined();
      expect(result.event).toBe('invoice.create');
      expect(result.uri).toBe('https://example.com/webhooks');
      expect(result.verified).toBe(false); // New callbacks start unverified
    });

    it('should create callback for payment events', async () => {
      const mockResponse = mockCallbackCreateResponse({
        event: 'payment.create',
        uri: 'https://myapp.com/webhooks',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackCreateTool.execute(
        {
          accountId: 'ABC123',
          event: 'payment.create',
          uri: 'https://myapp.com/webhooks',
        },
        mockClient as any
      );

      expect(result.event).toBe('payment.create');
    });

    it('should create callback for time_entry events', async () => {
      const mockResponse = mockCallbackCreateResponse({
        event: 'time_entry.update',
        uri: 'https://timetracker.com/webhooks',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackCreateTool.execute(
        {
          accountId: 'ABC123',
          event: 'time_entry.update',
          uri: 'https://timetracker.com/webhooks',
        },
        mockClient as any
      );

      expect(result.event).toBe('time_entry.update');
    });

    it('should create callback for client events', async () => {
      const mockResponse = mockCallbackCreateResponse({
        event: 'client.create',
        uri: 'https://crm.com/webhooks',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackCreateTool.execute(
        {
          accountId: 'ABC123',
          event: 'client.create',
          uri: 'https://crm.com/webhooks',
        },
        mockClient as any
      );

      expect(result.event).toBe('client.create');
    });

    it('should accept URIs with query parameters', async () => {
      const uri = 'https://example.com/webhooks?token=abc123';
      const mockResponse = mockCallbackCreateResponse({ uri });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackCreateTool.execute(
        {
          accountId: 'ABC123',
          event: 'invoice.create',
          uri,
        },
        mockClient as any
      );

      expect(result.uri).toBe(uri);
    });

    it('should accept URIs with port numbers', async () => {
      const uri = 'https://example.com:8443/webhooks';
      const mockResponse = mockCallbackCreateResponse({ uri });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackCreateTool.execute(
        {
          accountId: 'ABC123',
          event: 'invoice.create',
          uri,
        },
        mockClient as any
      );

      expect(result.uri).toBe(uri);
    });
  });

  describe('validation errors', () => {
    it('should reject non-HTTPS URIs', async () => {
      await expect(
        callbackCreateTool.execute(
          {
            accountId: 'ABC123',
            event: 'invoice.create',
            uri: 'http://example.com/webhooks', // HTTP instead of HTTPS
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject URIs without protocol', async () => {
      await expect(
        callbackCreateTool.execute(
          {
            accountId: 'ABC123',
            event: 'invoice.create',
            uri: 'example.com/webhooks',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require event field', async () => {
      await expect(
        callbackCreateTool.execute(
          {
            accountId: 'ABC123',
            uri: 'https://example.com/webhooks',
          } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require uri field', async () => {
      await expect(
        callbackCreateTool.execute(
          {
            accountId: 'ABC123',
            event: 'invoice.create',
          } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require accountId', async () => {
      await expect(
        callbackCreateTool.execute(
          {
            event: 'invoice.create',
            uri: 'https://example.com/webhooks',
          } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject empty event string', async () => {
      await expect(
        callbackCreateTool.execute(
          {
            accountId: 'ABC123',
            event: '',
            uri: 'https://example.com/webhooks',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject invalid URI format', async () => {
      await expect(
        callbackCreateTool.execute(
          {
            accountId: 'ABC123',
            event: 'invoice.create',
            uri: 'not-a-valid-url',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle duplicate callback error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            create: vi.fn().mockResolvedValue(mockCallbackDuplicateError('invoice.create')),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackCreateTool.execute(
          {
            accountId: 'ABC123',
            event: 'invoice.create',
            uri: 'https://example.com/webhooks',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unreachable endpoint error', async () => {
      const uri = 'https://unreachable.example.com/webhooks';
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            create: vi.fn().mockResolvedValue(mockCallbackUnreachableEndpointError(uri)),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackCreateTool.execute(
          {
            accountId: 'ABC123',
            event: 'invoice.create',
            uri,
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            create: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackCreateTool.execute(
          {
            accountId: 'ABC123',
            event: 'invoice.create',
            uri: 'https://example.com/webhooks',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            create: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackCreateTool.execute(
          {
            accountId: 'ABC123',
            event: 'invoice.create',
            uri: 'https://example.com/webhooks',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            create: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackCreateTool.execute(
          {
            accountId: 'ABC123',
            event: 'invoice.create',
            uri: 'https://example.com/webhooks',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        callbackCreateTool.execute(
          {
            accountId: 'ABC123',
            event: 'invoice.create',
            uri: 'https://example.com/webhooks',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle invalid account error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            create: vi.fn().mockResolvedValue(mockInvalidAccountError('ABC123')),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackCreateTool.execute(
          {
            accountId: 'ABC123',
            event: 'invoice.create',
            uri: 'https://example.com/webhooks',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle invalid event type error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            create: vi.fn().mockResolvedValue(mockValidationError('event', 'Invalid event type')),
          },
        };
        return apiCall(client);
      });

      await expect(
        callbackCreateTool.execute(
          {
            accountId: 'ABC123',
            event: 'invalid.event',
            uri: 'https://example.com/webhooks',
          },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle URIs with subdomains', async () => {
      const uri = 'https://webhooks.api.example.com/callbacks';
      const mockResponse = mockCallbackCreateResponse({ uri });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackCreateTool.execute(
        {
          accountId: 'ABC123',
          event: 'invoice.create',
          uri,
        },
        mockClient as any
      );

      expect(result.uri).toBe(uri);
    });

    it('should handle URIs with deep paths', async () => {
      const uri = 'https://example.com/api/v2/integrations/freshbooks/webhooks';
      const mockResponse = mockCallbackCreateResponse({ uri });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackCreateTool.execute(
        {
          accountId: 'ABC123',
          event: 'invoice.create',
          uri,
        },
        mockClient as any
      );

      expect(result.uri).toBe(uri);
    });

    it('should handle complex event names with underscores', async () => {
      const mockResponse = mockCallbackCreateResponse({
        event: 'expense_category.delete',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          callbacks: {
            create: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await callbackCreateTool.execute(
        {
          accountId: 'ABC123',
          event: 'expense_category.delete',
          uri: 'https://example.com/webhooks',
        },
        mockClient as any
      );

      expect(result.event).toBe('expense_category.delete');
    });
  });
});
