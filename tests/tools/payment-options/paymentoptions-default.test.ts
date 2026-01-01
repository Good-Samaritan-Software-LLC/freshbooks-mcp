/**
 * Tests for paymentoptions_default tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { paymentOptionsDefaultTool } from '../../../src/tools/payment-options/paymentoptions-default.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockPaymentOptionsDefaultResponse,
  mockGatewayNotConfiguredError,
} from '../../mocks/responses/payment-options.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
  mockForbiddenError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('paymentoptions_default tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should retrieve default payment options', async () => {
      const mockResponse = mockPaymentOptionsDefaultResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            default: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsDefaultTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result).toBeDefined();
      expect(result.gateway).toBeDefined();
    });

    it('should return default payment options with credit card enabled', async () => {
      const mockResponse = mockPaymentOptionsDefaultResponse({
        hasCreditCard: true,
        hasAch: false,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            default: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsDefaultTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.hasCreditCard).toBe(true);
      expect(result.hasAch).toBe(false);
    });

    it('should return default payment options with ACH enabled', async () => {
      const mockResponse = mockPaymentOptionsDefaultResponse({
        hasCreditCard: false,
        hasAch: true,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            default: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsDefaultTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.hasCreditCard).toBe(false);
      expect(result.hasAch).toBe(true);
    });

    it('should return default payment options with PayPal enabled', async () => {
      const mockResponse = mockPaymentOptionsDefaultResponse({
        hasPaypalSmartCheckout: true,
        gateway: 'paypal',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            default: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsDefaultTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.hasPaypalSmartCheckout).toBe(true);
      expect(result.gateway).toBe('paypal');
    });

    it('should return default payment options with all methods enabled', async () => {
      const mockResponse = mockPaymentOptionsDefaultResponse({
        hasCreditCard: true,
        hasAch: true,
        hasPaypalSmartCheckout: true,
        allowPartialPayments: true,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            default: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsDefaultTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.hasCreditCard).toBe(true);
      expect(result.hasAch).toBe(true);
      expect(result.hasPaypalSmartCheckout).toBe(true);
      expect(result.allowPartialPayments).toBe(true);
    });

    it('should return default payment options with Stripe gateway', async () => {
      const mockResponse = mockPaymentOptionsDefaultResponse({
        gateway: 'stripe',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            default: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsDefaultTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.gateway).toBe('stripe');
    });

    it('should return default payment options with PayPal gateway', async () => {
      const mockResponse = mockPaymentOptionsDefaultResponse({
        gateway: 'paypal',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            default: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsDefaultTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.gateway).toBe('paypal');
    });

    it('should return default payment options with Square gateway', async () => {
      const mockResponse = mockPaymentOptionsDefaultResponse({
        gateway: 'square',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            default: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsDefaultTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.gateway).toBe('square');
    });

    it('should return default payment options with Authorize.Net gateway', async () => {
      const mockResponse = mockPaymentOptionsDefaultResponse({
        gateway: 'authorize_net',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            default: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsDefaultTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.gateway).toBe('authorize_net');
    });

    it('should return default payment options with WePay gateway', async () => {
      const mockResponse = mockPaymentOptionsDefaultResponse({
        gateway: 'wepay',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            default: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsDefaultTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.gateway).toBe('wepay');
    });

    it('should return default payment options with partial payments allowed', async () => {
      const mockResponse = mockPaymentOptionsDefaultResponse({
        allowPartialPayments: true,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            default: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsDefaultTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.allowPartialPayments).toBe(true);
    });

    it('should return default payment options with partial payments disabled', async () => {
      const mockResponse = mockPaymentOptionsDefaultResponse({
        allowPartialPayments: false,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            default: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsDefaultTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.allowPartialPayments).toBe(false);
    });

    it('should return default payment options with all methods disabled', async () => {
      const mockResponse = mockPaymentOptionsDefaultResponse({
        hasCreditCard: false,
        hasAch: false,
        hasPaypalSmartCheckout: false,
        allowPartialPayments: false,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            default: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsDefaultTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.hasCreditCard).toBe(false);
      expect(result.hasAch).toBe(false);
      expect(result.hasPaypalSmartCheckout).toBe(false);
      expect(result.allowPartialPayments).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            default: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsDefaultTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle forbidden error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            default: vi.fn().mockResolvedValue(mockForbiddenError('payment options')),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsDefaultTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            default: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsDefaultTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            default: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsDefaultTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        paymentOptionsDefaultTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle gateway not configured error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            default: vi.fn().mockResolvedValue(mockGatewayNotConfiguredError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsDefaultTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        paymentOptionsDefaultTool.execute({} as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject non-string accountId', async () => {
      await expect(
        paymentOptionsDefaultTool.execute({ accountId: 12345 as any }, mockClient as any)
      ).rejects.toThrow();
    });

    it('should accept valid accountId', async () => {
      const mockResponse = mockPaymentOptionsDefaultResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            default: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsDefaultTool.execute({ accountId: 'ABC123' }, mockClient as any)
      ).resolves.toBeDefined();
    });

    it('should accept different account ID formats', async () => {
      const mockResponse = mockPaymentOptionsDefaultResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            default: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      // Should accept alphanumeric account IDs
      await expect(
        paymentOptionsDefaultTool.execute({ accountId: 'XYZ789' }, mockClient as any)
      ).resolves.toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle response with no gateway specified', async () => {
      const mockResponse = mockPaymentOptionsDefaultResponse({
        gateway: undefined,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            default: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsDefaultTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.gateway).toBeUndefined();
    });

    it('should handle response with only required fields', async () => {
      const mockResponse = mockPaymentOptionsDefaultResponse({
        gateway: undefined,
        hasPaypalSmartCheckout: undefined,
        allowPartialPayments: undefined,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            default: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsDefaultTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.hasCreditCard).toBeDefined();
      expect(result.hasAch).toBeDefined();
    });

    it('should handle boolean values correctly', async () => {
      const mockResponse = mockPaymentOptionsDefaultResponse({
        hasCreditCard: true,
        hasAch: false,
        hasPaypalSmartCheckout: true,
        allowPartialPayments: false,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            default: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsDefaultTool.execute(
        { accountId: 'ABC123' },
        mockClient as any
      );

      expect(result.hasCreditCard).toBe(true);
      expect(result.hasAch).toBe(false);
      expect(result.hasPaypalSmartCheckout).toBe(true);
      expect(result.allowPartialPayments).toBe(false);
    });
  });
});
