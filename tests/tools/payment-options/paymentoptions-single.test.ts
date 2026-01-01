/**
 * Tests for paymentoptions_single tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { paymentOptionsSingleTool } from '../../../src/tools/payment-options/paymentoptions-single.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockPaymentOptionsSingleResponse,
  mockPaymentOptionsNotFoundError,
  mockPaymentOptionsCreditCardOnly,
  mockPaymentOptionsAchOnly,
  mockPaymentOptionsAllEnabled,
  mockPaymentOptionsWithPayPal,
  mockPaymentOptionsForEstimate,
  mockInvalidEntityTypeError,
} from '../../mocks/responses/payment-options.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('paymentoptions_single tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should retrieve payment options for an invoice', async () => {
      const mockResponse = mockPaymentOptionsSingleResponse({
        entityId: 12345,
        entityType: 'invoice',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsSingleTool.execute(
        { accountId: 'ABC123', entityId: 12345, entityType: 'invoice' },
        mockClient as any
      );

      expect(result.entityId).toBe(12345);
      expect(result.entityType).toBe('invoice');
    });

    it('should retrieve payment options for an estimate', async () => {
      const mockResponse = mockPaymentOptionsForEstimate(67890);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsSingleTool.execute(
        { accountId: 'ABC123', entityId: 67890, entityType: 'estimate' },
        mockClient as any
      );

      expect(result.entityId).toBe(67890);
      expect(result.entityType).toBe('estimate');
    });

    it('should return payment options with credit card only', async () => {
      const mockResponse = mockPaymentOptionsCreditCardOnly(12345);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsSingleTool.execute(
        { accountId: 'ABC123', entityId: 12345, entityType: 'invoice' },
        mockClient as any
      );

      expect(result.hasCreditCard).toBe(true);
      expect(result.hasAch).toBe(false);
      expect(result.hasPaypalSmartCheckout).toBe(false);
    });

    it('should return payment options with ACH only', async () => {
      const mockResponse = mockPaymentOptionsAchOnly(12345);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsSingleTool.execute(
        { accountId: 'ABC123', entityId: 12345, entityType: 'invoice' },
        mockClient as any
      );

      expect(result.hasCreditCard).toBe(false);
      expect(result.hasAch).toBe(true);
    });

    it('should return payment options with all methods enabled', async () => {
      const mockResponse = mockPaymentOptionsAllEnabled(12345);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsSingleTool.execute(
        { accountId: 'ABC123', entityId: 12345, entityType: 'invoice' },
        mockClient as any
      );

      expect(result.hasCreditCard).toBe(true);
      expect(result.hasAch).toBe(true);
      expect(result.hasPaypalSmartCheckout).toBe(true);
      expect(result.allowPartialPayments).toBe(true);
    });

    it('should return payment options with PayPal gateway', async () => {
      const mockResponse = mockPaymentOptionsWithPayPal(12345);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsSingleTool.execute(
        { accountId: 'ABC123', entityId: 12345, entityType: 'invoice' },
        mockClient as any
      );

      expect(result.gateway).toBe('paypal');
      expect(result.hasPaypalSmartCheckout).toBe(true);
    });

    it('should return payment options with gateway info', async () => {
      const mockResponse = mockPaymentOptionsSingleResponse({
        gateway: 'stripe',
        gatewayInfo: {
          gateway: 'stripe',
          gatewayId: 'gw_stripe_123',
        },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsSingleTool.execute(
        { accountId: 'ABC123', entityId: 12345, entityType: 'invoice' },
        mockClient as any
      );

      expect(result.gatewayInfo).toBeDefined();
      expect(result.gatewayInfo?.gateway).toBe('stripe');
      expect(result.gatewayInfo?.gatewayId).toBe('gw_stripe_123');
    });

    it('should return payment options with partial payments allowed', async () => {
      const mockResponse = mockPaymentOptionsSingleResponse({
        allowPartialPayments: true,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await paymentOptionsSingleTool.execute(
        { accountId: 'ABC123', entityId: 12345, entityType: 'invoice' },
        mockClient as any
      );

      expect(result.allowPartialPayments).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            single: vi.fn().mockResolvedValue(mockPaymentOptionsNotFoundError(99999, 'invoice')),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsSingleTool.execute(
          { accountId: 'ABC123', entityId: 99999, entityType: 'invoice' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            single: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsSingleTool.execute(
          { accountId: 'ABC123', entityId: 12345, entityType: 'invoice' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            single: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsSingleTool.execute(
          { accountId: 'ABC123', entityId: 12345, entityType: 'invoice' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            single: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsSingleTool.execute(
          { accountId: 'ABC123', entityId: 12345, entityType: 'invoice' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        paymentOptionsSingleTool.execute(
          { accountId: 'ABC123', entityId: 12345, entityType: 'invoice' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle invalid entity type error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            single: vi.fn().mockResolvedValue(mockInvalidEntityTypeError('invalid')),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsSingleTool.execute(
          { accountId: 'ABC123', entityId: 12345, entityType: 'invoice' },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        paymentOptionsSingleTool.execute(
          { entityId: 12345, entityType: 'invoice' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require entityId', async () => {
      await expect(
        paymentOptionsSingleTool.execute(
          { accountId: 'ABC123', entityType: 'invoice' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require entityType', async () => {
      await expect(
        paymentOptionsSingleTool.execute(
          { accountId: 'ABC123', entityId: 12345 } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject non-numeric entityId', async () => {
      await expect(
        paymentOptionsSingleTool.execute(
          { accountId: 'ABC123', entityId: 'invalid' as any, entityType: 'invoice' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should only accept invoice or estimate for entityType', async () => {
      await expect(
        paymentOptionsSingleTool.execute(
          { accountId: 'ABC123', entityId: 12345, entityType: 'invalid' as any },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should accept valid invoice entityType', async () => {
      const mockResponse = mockPaymentOptionsSingleResponse();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsSingleTool.execute(
          { accountId: 'ABC123', entityId: 12345, entityType: 'invoice' },
          mockClient as any
        )
      ).resolves.toBeDefined();
    });

    it('should accept valid estimate entityType', async () => {
      const mockResponse = mockPaymentOptionsForEstimate();

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          paymentOptions: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      await expect(
        paymentOptionsSingleTool.execute(
          { accountId: 'ABC123', entityId: 67890, entityType: 'estimate' },
          mockClient as any
        )
      ).resolves.toBeDefined();
    });
  });
});
